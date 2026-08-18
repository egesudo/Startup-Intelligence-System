/**
 * Venture Service
 * Coordinates business operations for Ventures, Intake Understanding, and Critical Questions.
 */

import { ventureRepository, IVentureRepository } from '../db/repository';
import { geminiIntakeService, IntakeRawInput } from './geminiService';
import { Venture, CriticalQuestion, Decision, NextAction } from '../../types/domain';
import { VentureAnalysisState, AgentWorkflowState } from '../../types/state';

export class VentureService {
  constructor(
    private repo: IVentureRepository = ventureRepository,
    private intakeAi = geminiIntakeService
  ) {}

  async listVentures(): Promise<Venture[]> {
    return this.repo.findAll();
  }

  async getVentureById(id: string): Promise<Venture | null> {
    return this.repo.findById(id);
  }

  /**
   * Constructs the full decoupled VentureAnalysisState from repository entities
   */
  async getAnalysisState(ventureId: string): Promise<VentureAnalysisState | null> {
    const venture = await this.repo.findById(ventureId);
    if (!venture) return null;

    const questions = venture.questions || [];
    const pendingRequired = questions.filter(q => q.required && q.status === 'PENDING');
    const allResolved = questions.every(q => q.status === 'ANSWERED' || q.status === 'SKIPPED');

    let questionsStatus: 'not_required' | 'pending' | 'completed' = 'pending';
    if (questions.length === 0) {
      questionsStatus = 'not_required';
    } else if (allResolved || pendingRequired.length === 0) {
      questionsStatus = 'completed';
    }

    let intakeStatus: 'draft' | 'ready' = 'draft';
    if (venture.status === 'evaluated' || venture.status === 'decided' || venture.status === 'analyzing' || questionsStatus === 'completed' || questionsStatus === 'not_required') {
      intakeStatus = 'ready';
    }

    let analysisStatus: 'not_started' | 'running' | 'completed' | 'failed' = 'not_started';
    if (venture.status === 'analyzing') {
      analysisStatus = 'running';
    } else if (venture.status === 'evaluated' || venture.status === 'decided') {
      analysisStatus = 'completed';
    }

    const questionAnswers: Record<string, string> = {};
    for (const q of questions) {
      if (q.answer) {
        questionAnswers[q.id] = q.answer;
      }
    }

    const agentWorkflow: AgentWorkflowState = {
      research: { status: venture.researchReport ? 'completed' : 'pending' },
      business: { status: venture.businessReport ? 'completed' : 'pending' },
      redTeam: { status: venture.redTeamReport ? 'completed' : 'pending' },
      judge: { status: venture.judgeReport ? 'completed' : 'pending' }
    };

    return {
      venture,
      criticalQuestions: questions,
      questionAnswers,
      researchReport: venture.researchReport || null,
      businessReport: venture.businessReport || null,
      redTeamReport: venture.redTeamReport || null,
      judgeReport: venture.judgeReport || null,
      scores: venture.score || null,
      nextActions: venture.nextActions || [],
      decision: venture.decision || null,
      agentWorkflow,
      lifecycleStatus: venture.status,
      intakeStatus,
      questionsStatus,
      analysisStatus
    };
  }

  /**
   * Phase 2: Natural-language Intake Flow
   * 1. Extracts structured venture representation via Gemini (or fallback).
   * 2. Formulates 0-5 high-value critical questions.
   * 3. Initializes persistent state for the venture.
   */
  async processIntake(input: IntakeRawInput): Promise<{ venture: Venture; analysisState: VentureAnalysisState }> {
    // 1. Structure Idea via Gemini
    const understanding = await this.intakeAi.understandIdea(input);

    // 2. Generate 0 to 5 Critical Questions
    const questionDrafts = await this.intakeAi.generateCriticalQuestions(understanding, input);

    // 3. Persist Venture
    const title = understanding.suggestedTitle || (input.idea.slice(0, 50) + '...');
    const createdVenture = await this.repo.create({
      title,
      description: input.idea,
      rawIdea: input.idea,
      targetAudience: understanding.targetCustomer || input.targetCustomer || '',
      valueProposition: understanding.valueProposition || '',
      monetizationIdea: understanding.businessModel || '',
      problem: understanding.problem,
      solution: understanding.solution,
      targetCustomer: understanding.targetCustomer || input.targetCustomer || null,
      marketGeography: understanding.marketGeography || input.geography || null,
      businessModel: understanding.businessModel || null,
      technology: understanding.technology || null,
      founderAssumptions: understanding.founderAssumptions || [],
      importantUnknowns: understanding.importantUnknowns || [],
      founderContext: input.context || '',
      status: questionDrafts.length === 0 ? 'draft' : 'clarifying'
    });

    // 4. Map and save questions
    const criticalQuestions: CriticalQuestion[] = questionDrafts.map((draft, idx) => ({
      id: `cq_${createdVenture.id}_${idx + 1}`,
      ventureId: createdVenture.id,
      questionNumber: idx + 1,
      question: draft.question,
      rationale: draft.whyItMatters,
      whyItMatters: draft.whyItMatters,
      category: draft.category,
      suggestedOptions: draft.suggestedOptions,
      required: draft.required,
      status: 'PENDING'
    }));

    if (criticalQuestions.length > 0) {
      await this.repo.saveQuestions(createdVenture.id, criticalQuestions);
    }

    const state = await this.getAnalysisState(createdVenture.id);
    return {
      venture: state!.venture,
      analysisState: state!
    };
  }

  /**
   * Direct Venture Creation (legacy / fallback support)
   */
  async createVenture(data: {
    title: string;
    description: string;
    targetAudience?: string;
    valueProposition?: string;
    monetizationIdea?: string;
  }): Promise<Venture> {
    const result = await this.processIntake({
      idea: `${data.title}: ${data.description}`,
      targetCustomer: data.targetAudience,
      context: [data.valueProposition, data.monetizationIdea].filter(Boolean).join('; ')
    });
    return result.venture;
  }

  async answerQuestion(ventureId: string, questionId: string, answer: string): Promise<CriticalQuestion | null> {
    return this.repo.updateQuestionAnswer(ventureId, questionId, answer);
  }

  async skipQuestion(ventureId: string, questionId: string): Promise<CriticalQuestion | null> {
    return this.repo.skipQuestion(ventureId, questionId);
  }

  async finalizeIntake(ventureId: string): Promise<VentureAnalysisState | null> {
    const venture = await this.repo.findById(ventureId);
    if (!venture) return null;

    if (venture.status === 'clarifying' || venture.status === 'draft') {
      await this.repo.update(ventureId, { status: 'draft' });
    }

    return this.getAnalysisState(ventureId);
  }

  async recordDecision(ventureId: string, data: {
    choice: Decision['choice'];
    rationale: string;
    alignmentWithAI: Decision['alignmentWithAI'];
    overrideReason?: string;
  }): Promise<Decision> {
    const decision: Decision = {
      id: `dec_${Date.now()}`,
      ventureId,
      choice: data.choice,
      rationale: data.rationale,
      alignmentWithAI: data.alignmentWithAI,
      overrideReason: data.overrideReason,
      decidedAt: new Date().toISOString()
    };

    return this.repo.saveDecision(ventureId, decision);
  }

  async toggleAction(ventureId: string, actionId: string): Promise<NextAction | null> {
    return this.repo.toggleActionCompletion(ventureId, actionId);
  }

  async deleteVenture(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }
}

export const ventureService = new VentureService();

