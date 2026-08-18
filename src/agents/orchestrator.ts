/**
 * Multi-Agent Orchestrator
 * 
 * Coordinates the sequential DAG workflow across the 4 specialized agents:
 * Venture -> Research Agent -> Business Agent -> Red Team Agent -> Judge Agent -> Scoring Engine
 * 
 * Manages structured data handoffs, preserves intermediate reports, and tracks execution states.
 */

import {
  VentureAnalysisState,
  AgentWorkflowState
} from '../types/state';
import {
  IResearchAgent,
  IBusinessAgent,
  IRedTeamAgent,
  IJudgeAgent
} from '../types/agents';
import { ResearchAgent } from './research/researchAgent';
import { BusinessAgent } from './business/businessAgent';
import { RedTeamAgent } from './red-team/redTeamAgent';
import { JudgeAgent } from './judge/judgeAgent';
import { ScoringEngine } from '../server/scoring/scoringEngine';
import { IVentureRepository, ventureRepository } from '../server/db/repository';
import { NextAction, CollaborationRecord, ConfidenceLevel } from '../types/domain';

export type OrchestrationEventCallback = (state: VentureAnalysisState) => void;

export class MultiAgentOrchestrator {
  constructor(
    private researchAgent: IResearchAgent = new ResearchAgent(),
    private businessAgent: IBusinessAgent = new BusinessAgent(),
    private redTeamAgent: IRedTeamAgent = new RedTeamAgent(),
    private judgeAgent: IJudgeAgent = new JudgeAgent(),
    private repo: IVentureRepository = ventureRepository
  ) {}

  private createCollaborationRecord(params: {
    agent: 'RESEARCH' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE';
    ventureId: string;
    inputContext: Record<string, any>;
    previousAgentReference?: string[];
    researchSources?: Array<{ id: string; title: string; publisher?: string }>;
    keyFindings: string[];
    assumptions: string[];
    confidence: ConfidenceLevel;
    status: 'COMPLETED' | 'FAILED';
    error?: string;
  }): CollaborationRecord {
    return {
      agent: params.agent,
      ventureId: params.ventureId,
      inputContext: params.inputContext,
      previousAgentReference: params.previousAgentReference || [],
      researchSources: params.researchSources || [],
      keyFindings: params.keyFindings,
      assumptions: params.assumptions,
      confidence: params.confidence,
      timestamp: new Date().toISOString(),
      status: params.status,
      error: params.error
    };
  }

  /**
   * Initializes state container for a venture analysis
   */
  public async getAnalysisState(ventureId: string): Promise<VentureAnalysisState | null> {
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
    } else if (venture.researchReport || venture.status === 'evaluated' || venture.status === 'decided') {
      analysisStatus = 'completed';
    }

    const questionAnswers: Record<string, string> = {};
    for (const q of questions) {
      if (q.answer) questionAnswers[q.id] = q.answer;
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
      collaborationRecords: venture.collaborationRecords || [],
      agentWorkflow,
      lifecycleStatus: venture.status,
      intakeStatus,
      questionsStatus,
      analysisStatus
    };
  }

  /**
   * Executes the Phase 3 Research Agent pipeline
   */
  public async executePipeline(
    ventureId: string,
    onProgress?: OrchestrationEventCallback
  ): Promise<VentureAnalysisState> {
    const venture = await this.repo.findById(ventureId);
    if (!venture) {
      throw new Error(`Venture with ID "${ventureId}" not found.`);
    }

    const questions = venture.questions || [];
    const questionAnswers: Record<string, string> = {};
    for (const q of questions) {
      if (q.answer) questionAnswers[q.id] = q.answer;
    }

    const state: VentureAnalysisState = {
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
      collaborationRecords: venture.collaborationRecords || [],
      agentWorkflow: {
        research: { status: 'pending' },
        business: { status: 'pending' },
        redTeam: { status: 'pending' },
        judge: { status: 'pending' }
      },
      lifecycleStatus: 'analyzing',
      intakeStatus: 'ready',
      questionsStatus: 'completed',
      analysisStatus: 'running'
    };

    await this.repo.update(ventureId, { status: 'analyzing' });

    const emit = () => {
      if (onProgress) onProgress({ ...state });
    };

    try {
      // ----------------------------------------------------
      // PHASE 3: RESEARCH AGENT EXECUTION
      // ----------------------------------------------------
      state.agentWorkflow.research = { status: 'running', startedAt: new Date().toISOString() };
      emit();

      const researchOutput = await this.researchAgent.analyze({
        ventureId: venture.id,
        ventureTitle: venture.title,
        ventureDescription: venture.description,
        targetAudience: venture.targetAudience,
        monetizationIdea: venture.monetizationIdea,
        rawIdea: venture.rawIdea,
        problem: venture.problem,
        solution: venture.solution,
        targetCustomer: venture.targetCustomer,
        marketGeography: venture.marketGeography,
        businessModel: venture.businessModel,
        technology: venture.technology,
        founderAssumptions: venture.founderAssumptions,
        importantUnknowns: venture.importantUnknowns,
        founderContext: venture.founderContext,
        answeredQuestions: state.criticalQuestions.filter(q => q.status === 'ANSWERED'),
        venture
      });

      const reportId = `rr_${Date.now()}`;
      const savedResearchReport = await this.repo.saveResearchReport(ventureId, {
        ...researchOutput.report,
        id: reportId,
        ventureId,
        createdAt: new Date().toISOString()
      });

      const researchRecord = this.createCollaborationRecord({
        agent: 'RESEARCH',
        ventureId,
        inputContext: {
          title: venture.title,
          problem: venture.problem,
          solution: venture.solution,
          targetCustomer: venture.targetCustomer || venture.targetAudience
        },
        researchSources: (savedResearchReport.sources || []).map(s => ({ id: s.id, title: s.title, publisher: s.publisher })),
        keyFindings: (savedResearchReport.findings || []).map(f => f.statement),
        assumptions: (savedResearchReport.unvalidatedAssumptions || []),
        confidence: ((savedResearchReport.confidence || savedResearchReport.confidenceScore || 'HIGH') as ConfidenceLevel),
        status: 'COMPLETED'
      });

      state.researchReport = savedResearchReport;
      state.collaborationRecords = [researchRecord];
      state.agentWorkflow.research = {
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      // Update Venture lifecycle state with research report and collaboration records
      await this.repo.update(ventureId, { 
        status: 'analyzing',
        researchReport: savedResearchReport,
        collaborationRecords: state.collaborationRecords
      });

      let updatedVenture = await this.repo.findById(ventureId);
      if (updatedVenture) {
        state.venture = updatedVenture;
      }
      emit();

      // ----------------------------------------------------
      // PHASE 4: BUSINESS AGENT EXECUTION
      // ----------------------------------------------------
      state.agentWorkflow.business = { status: 'running', startedAt: new Date().toISOString() };
      emit();

      try {
        const businessOutput = await this.businessAgent.evaluate({
          ventureId: venture.id,
          ventureTitle: state.venture.title,
          ventureDescription: state.venture.description,
          targetAudience: state.venture.targetAudience,
          monetizationIdea: state.venture.monetizationIdea,
          rawIdea: state.venture.rawIdea,
          problem: state.venture.problem,
          solution: state.venture.solution,
          targetCustomer: state.venture.targetCustomer,
          marketGeography: state.venture.marketGeography,
          businessModel: state.venture.businessModel,
          technology: state.venture.technology,
          founderAssumptions: state.venture.founderAssumptions,
          importantUnknowns: state.venture.importantUnknowns,
          founderContext: state.venture.founderContext,
          answeredQuestions: state.criticalQuestions.filter(q => q.status === 'ANSWERED'),
          researchReport: savedResearchReport,
          venture: state.venture
        });

        const businessReportId = `br_${Date.now()}`;
        const savedBusinessReport = await this.repo.saveBusinessReport(ventureId, {
          ...businessOutput.report,
          id: businessReportId,
          ventureId,
          createdAt: new Date().toISOString()
        });

        const businessRecord = this.createCollaborationRecord({
          agent: 'BUSINESS',
          ventureId,
          inputContext: {
            researchReportId: savedResearchReport.id,
            businessModel: state.venture.businessModel,
            monetizationIdea: state.venture.monetizationIdea
          },
          previousAgentReference: [savedResearchReport.id],
          researchSources: (savedBusinessReport.sources || []).map(s => ({ id: s.id, title: s.title, publisher: s.publisher })),
          keyFindings: [
            savedBusinessReport.problemEconomics?.valueProposition || savedBusinessReport.executiveSummary || 'Commercial viability evaluation',
            `Archetype: ${savedBusinessReport.archetype || 'N/A'}`
          ],
          assumptions: (savedBusinessReport.assumptions || savedBusinessReport.businessAssumptions || []).map(a => a.statement),
          confidence: ((savedBusinessReport.confidence || 'HIGH') as ConfidenceLevel),
          status: 'COMPLETED'
        });

        state.businessReport = savedBusinessReport;
        state.collaborationRecords = [...(state.collaborationRecords || []), businessRecord];
        state.agentWorkflow.business = {
          status: 'completed',
          completedAt: new Date().toISOString()
        };

        // Update Venture lifecycle state with business report
        await this.repo.update(ventureId, {
          status: 'analyzing',
          businessReport: savedBusinessReport,
          collaborationRecords: state.collaborationRecords
        });

        updatedVenture = await this.repo.findById(ventureId);
        if (updatedVenture) {
          state.venture = updatedVenture;
        }

        emit();
      } catch (bizErr: any) {
        console.error(`[MultiAgentOrchestrator] Business Agent failed for venture ${ventureId}:`, bizErr);
        state.agentWorkflow.business = {
          status: 'failed',
          error: bizErr.message || 'Commercial evaluation failed. Please retry.'
        };
        state.analysisStatus = 'failed';
        emit();
        throw bizErr;
      }

      // ----------------------------------------------------
      // PHASE 5: RED TEAM AGENT EXECUTION
      // ----------------------------------------------------
      state.agentWorkflow.redTeam = { status: 'running', startedAt: new Date().toISOString() };
      emit();

      try {
        const redTeamOutput = await this.redTeamAgent.challenge({
          ventureId: venture.id,
          ventureTitle: state.venture.title,
          ventureDescription: state.venture.description,
          targetAudience: state.venture.targetAudience,
          monetizationIdea: state.venture.monetizationIdea,
          rawIdea: state.venture.rawIdea,
          problem: state.venture.problem,
          solution: state.venture.solution,
          targetCustomer: state.venture.targetCustomer,
          marketGeography: state.venture.marketGeography,
          businessModel: state.venture.businessModel,
          technology: state.venture.technology,
          founderAssumptions: state.venture.founderAssumptions,
          importantUnknowns: state.venture.importantUnknowns,
          founderContext: state.venture.founderContext,
          answeredQuestions: state.criticalQuestions.filter(q => q.status === 'ANSWERED'),
          researchReport: state.researchReport || undefined,
          businessReport: state.businessReport || undefined,
          venture: state.venture
        });

        const redTeamReportId = `rt_${Date.now()}`;
        const savedRedTeamReport = await this.repo.saveRedTeamReport(ventureId, {
          ...redTeamOutput.report,
          id: redTeamReportId,
          ventureId,
          createdAt: new Date().toISOString()
        });

        const redTeamRecord = this.createCollaborationRecord({
          agent: 'RED_TEAM',
          ventureId,
          inputContext: {
            researchReportId: state.researchReport?.id,
            businessReportId: state.businessReport?.id
          },
          previousAgentReference: [
            ...(state.researchReport ? [state.researchReport.id] : []),
            ...(state.businessReport ? [state.businessReport.id] : [])
          ],
          researchSources: (savedRedTeamReport.sources || []).map(s => ({ id: s.id, title: s.title, publisher: s.publisher })),
          keyFindings: (savedRedTeamReport.criticalRisks || (savedRedTeamReport as any).fatalFlaws || []).map((r: any) => r.title || r.description || r.riskSummary),
          assumptions: (savedRedTeamReport.assumptionAttacks || []).map(a => a.assumption),
          confidence: ((savedRedTeamReport.confidence || 'HIGH') as ConfidenceLevel),
          status: 'COMPLETED'
        });

        state.redTeamReport = savedRedTeamReport;
        state.collaborationRecords = [...(state.collaborationRecords || []), redTeamRecord];
        state.agentWorkflow.redTeam = {
          status: 'completed',
          completedAt: new Date().toISOString()
        };
        state.analysisStatus = 'completed';

        // Update Venture lifecycle state with red team report
        await this.repo.update(ventureId, {
          status: 'analyzing',
          redTeamReport: savedRedTeamReport,
          collaborationRecords: state.collaborationRecords
        });

        updatedVenture = await this.repo.findById(ventureId);
        if (updatedVenture) {
          state.venture = updatedVenture;
        }

        emit();
      } catch (rtErr: any) {
        console.error(`[MultiAgentOrchestrator] Red Team Agent failed for venture ${ventureId}:`, rtErr);
        state.agentWorkflow.redTeam = {
          status: 'failed',
          error: rtErr.message || 'Red team adversarial analysis failed. Please retry.'
        };
        state.analysisStatus = 'failed';
        emit();
        throw rtErr;
      }

      // ----------------------------------------------------
      // PHASE 6: JUDGE AGENT SYNTHESIS
      // ----------------------------------------------------
      state.agentWorkflow.judge = { status: 'running', startedAt: new Date().toISOString() };
      emit();

      try {
        const judgeOutput = await this.judgeAgent.synthesize({
          ventureId: venture.id,
          ventureTitle: state.venture.title,
          ventureDescription: state.venture.description,
          targetAudience: state.venture.targetAudience,
          monetizationIdea: state.venture.monetizationIdea,
          rawIdea: state.venture.rawIdea,
          problem: state.venture.problem,
          solution: state.venture.solution,
          targetCustomer: state.venture.targetCustomer,
          marketGeography: state.venture.marketGeography,
          businessModel: state.venture.businessModel,
          technology: state.venture.technology,
          founderAssumptions: state.venture.founderAssumptions,
          importantUnknowns: state.venture.importantUnknowns,
          founderContext: state.venture.founderContext,
          answeredQuestions: state.criticalQuestions.filter(q => q.status === 'ANSWERED'),
          researchReport: state.researchReport || undefined,
          businessReport: state.businessReport || undefined,
          redTeamReport: state.redTeamReport || undefined,
          venture: state.venture
        });

        const judgeReportId = `jr_${Date.now()}`;
        const savedJudgeReport = await this.repo.saveJudgeReport(ventureId, {
          ...judgeOutput.report,
          id: judgeReportId,
          ventureId,
          createdAt: new Date().toISOString()
        });

        const savedActions = await this.repo.saveNextActions(ventureId, savedJudgeReport.nextActions || []);

        // Calculate and persist deterministic readiness score
        const computedScore = ScoringEngine.calculate(
          ventureId,
          undefined,
          state.researchReport,
          state.businessReport,
          state.redTeamReport
        );
        const savedScore = await this.repo.saveVentureScore(ventureId, computedScore);

        const judgeRecord = this.createCollaborationRecord({
          agent: 'JUDGE',
          ventureId,
          inputContext: {
            researchReportId: state.researchReport?.id,
            businessReportId: state.businessReport?.id,
            redTeamReportId: state.redTeamReport?.id
          },
          previousAgentReference: [
            ...(state.researchReport ? [state.researchReport.id] : []),
            ...(state.businessReport ? [state.businessReport.id] : []),
            ...(state.redTeamReport ? [state.redTeamReport.id] : [])
          ],
          researchSources: (savedJudgeReport.sourceReferences || []).map(s => ({ id: s.id, title: s.title, publisher: s.publisher })),
          keyFindings: [
            `AI Recommendation: ${savedJudgeReport.aiRecommendation}`,
            savedJudgeReport.coreVentureThesis?.statement || savedJudgeReport.executiveSummary
          ],
          assumptions: savedJudgeReport.criticalAssumptions || [],
          confidence: savedJudgeReport.recommendationConfidence,
          status: 'COMPLETED'
        });

        state.judgeReport = savedJudgeReport;
        state.nextActions = savedActions;
        state.scores = savedScore;
        state.collaborationRecords = [...(state.collaborationRecords || []), judgeRecord];
        state.agentWorkflow.judge = {
          status: 'completed',
          completedAt: new Date().toISOString()
        };
        state.analysisStatus = 'completed';

        // Update Venture lifecycle state to evaluated
        await this.repo.update(ventureId, {
          status: 'evaluated',
          judgeReport: savedJudgeReport,
          nextActions: savedActions,
          score: savedScore,
          collaborationRecords: state.collaborationRecords
        });

        updatedVenture = await this.repo.findById(ventureId);
        if (updatedVenture) {
          state.venture = updatedVenture;
        }

        emit();
      } catch (judgeErr: any) {
        console.error(`[MultiAgentOrchestrator] Judge Agent failed for venture ${ventureId}:`, judgeErr);
        state.agentWorkflow.judge = {
          status: 'failed',
          error: judgeErr.message || 'Judge synthesis failed. Please retry.'
        };
        state.analysisStatus = 'failed';
        emit();
        throw judgeErr;
      }

      return state;
    } catch (err: any) {
      console.error(`[MultiAgentOrchestrator] Agent pipeline failed for venture ${ventureId}:`, err);
      
      if (state.agentWorkflow.research.status === 'running') {
        state.agentWorkflow.research = { 
          status: 'failed', 
          error: err.message || 'Empirical research investigation failed. Please retry.' 
        };
      }
      state.analysisStatus = 'failed';

      await this.repo.update(ventureId, { status: 'draft' });

      emit();
      throw err;
    }
  }

  /**
   * Executes the Phase 4 Business Agent independently using existing venture & research data
   */
  public async executeBusinessAgentOnly(
    ventureId: string,
    onProgress?: OrchestrationEventCallback
  ): Promise<VentureAnalysisState> {
    const currentState = await this.getAnalysisState(ventureId);
    if (!currentState) {
      throw new Error(`Venture with ID "${ventureId}" not found.`);
    }

    const state = { ...currentState };
    state.analysisStatus = 'running';
    state.agentWorkflow.business = { status: 'running', startedAt: new Date().toISOString() };

    const emit = () => {
      if (onProgress) onProgress({ ...state });
    };
    emit();

    try {
      const businessOutput = await this.businessAgent.evaluate({
        ventureId: state.venture.id,
        ventureTitle: state.venture.title,
        ventureDescription: state.venture.description,
        targetAudience: state.venture.targetAudience,
        monetizationIdea: state.venture.monetizationIdea,
        rawIdea: state.venture.rawIdea,
        problem: state.venture.problem,
        solution: state.venture.solution,
        targetCustomer: state.venture.targetCustomer,
        marketGeography: state.venture.marketGeography,
        businessModel: state.venture.businessModel,
        technology: state.venture.technology,
        founderAssumptions: state.venture.founderAssumptions,
        importantUnknowns: state.venture.importantUnknowns,
        founderContext: state.venture.founderContext,
        answeredQuestions: state.criticalQuestions.filter(q => q.status === 'ANSWERED'),
        researchReport: state.researchReport || undefined,
        venture: state.venture
      });

      const businessReportId = `br_${Date.now()}`;
      const savedBusinessReport = await this.repo.saveBusinessReport(ventureId, {
        ...businessOutput.report,
        id: businessReportId,
        ventureId,
        createdAt: new Date().toISOString()
      });

      const businessRecord = this.createCollaborationRecord({
        agent: 'BUSINESS',
        ventureId,
        inputContext: {
          researchReportId: state.researchReport?.id,
          businessModel: state.venture.businessModel,
          monetizationIdea: state.venture.monetizationIdea
        },
        previousAgentReference: state.researchReport ? [state.researchReport.id] : [],
        researchSources: (savedBusinessReport.sources || []).map(s => ({ id: s.id, title: s.title, publisher: s.publisher })),
        keyFindings: [
          savedBusinessReport.problemEconomics?.valueProposition || savedBusinessReport.executiveSummary || 'Commercial viability evaluation',
          `Archetype: ${savedBusinessReport.archetype || 'N/A'}`
        ],
        assumptions: (savedBusinessReport.assumptions || savedBusinessReport.businessAssumptions || []).map(a => a.statement),
        confidence: ((savedBusinessReport.confidence || 'HIGH') as ConfidenceLevel),
        status: 'COMPLETED'
      });

      state.businessReport = savedBusinessReport;
      state.collaborationRecords = [
        ...(state.collaborationRecords || []).filter(r => r.agent !== 'BUSINESS'),
        businessRecord
      ];
      state.agentWorkflow.business = {
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      state.analysisStatus = 'completed';

      await this.repo.update(ventureId, {
        status: 'analyzing',
        businessReport: savedBusinessReport,
        collaborationRecords: state.collaborationRecords
      });

      const updatedVenture = await this.repo.findById(ventureId);
      if (updatedVenture) {
        state.venture = updatedVenture;
      }

      emit();
      return state;
    } catch (err: any) {
      console.error(`[MultiAgentOrchestrator] Business Agent execution failed for venture ${ventureId}:`, err);
      state.agentWorkflow.business = {
        status: 'failed',
        error: err.message || 'Commercial evaluation failed. Please retry.'
      };
      state.analysisStatus = 'failed';
      emit();
      throw err;
    }
  }

  /**
   * Executes the Phase 5 Red Team Agent independently using existing venture, research & business data
   */
  public async executeRedTeamAgentOnly(
    ventureId: string,
    onProgress?: OrchestrationEventCallback
  ): Promise<VentureAnalysisState> {
    const currentState = await this.getAnalysisState(ventureId);
    if (!currentState) {
      throw new Error(`Venture with ID "${ventureId}" not found.`);
    }

    const state = { ...currentState };
    state.analysisStatus = 'running';
    state.agentWorkflow.redTeam = { status: 'running', startedAt: new Date().toISOString() };

    const emit = () => {
      if (onProgress) onProgress({ ...state });
    };
    emit();

    try {
      const redTeamOutput = await this.redTeamAgent.challenge({
        ventureId: state.venture.id,
        ventureTitle: state.venture.title,
        ventureDescription: state.venture.description,
        targetAudience: state.venture.targetAudience,
        monetizationIdea: state.venture.monetizationIdea,
        rawIdea: state.venture.rawIdea,
        problem: state.venture.problem,
        solution: state.venture.solution,
        targetCustomer: state.venture.targetCustomer,
        marketGeography: state.venture.marketGeography,
        businessModel: state.venture.businessModel,
        technology: state.venture.technology,
        founderAssumptions: state.venture.founderAssumptions,
        importantUnknowns: state.venture.importantUnknowns,
        founderContext: state.venture.founderContext,
        answeredQuestions: state.criticalQuestions.filter(q => q.status === 'ANSWERED'),
        researchReport: state.researchReport || undefined,
        businessReport: state.businessReport || undefined,
        venture: state.venture
      });

      const redTeamReportId = `rt_${Date.now()}`;
      const savedRedTeamReport = await this.repo.saveRedTeamReport(ventureId, {
        ...redTeamOutput.report,
        id: redTeamReportId,
        ventureId,
        createdAt: new Date().toISOString()
      });

      const redTeamRecord = this.createCollaborationRecord({
        agent: 'RED_TEAM',
        ventureId,
        inputContext: {
          researchReportId: state.researchReport?.id,
          businessReportId: state.businessReport?.id
        },
        previousAgentReference: [
          ...(state.researchReport ? [state.researchReport.id] : []),
          ...(state.businessReport ? [state.businessReport.id] : [])
        ],
        researchSources: (savedRedTeamReport.sources || []).map(s => ({ id: s.id, title: s.title, publisher: s.publisher })),
        keyFindings: (savedRedTeamReport.criticalRisks || (savedRedTeamReport as any).fatalFlaws || []).map((r: any) => r.title || r.description || r.riskSummary),
        assumptions: (savedRedTeamReport.assumptionAttacks || []).map(a => a.assumption),
        confidence: ((savedRedTeamReport.confidence || 'HIGH') as ConfidenceLevel),
        status: 'COMPLETED'
      });

      state.redTeamReport = savedRedTeamReport;
      state.collaborationRecords = [
        ...(state.collaborationRecords || []).filter(r => r.agent !== 'RED_TEAM'),
        redTeamRecord
      ];
      state.agentWorkflow.redTeam = {
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      state.analysisStatus = 'completed';

      await this.repo.update(ventureId, {
        status: 'analyzing',
        redTeamReport: savedRedTeamReport,
        collaborationRecords: state.collaborationRecords
      });

      const updatedVenture = await this.repo.findById(ventureId);
      if (updatedVenture) {
        state.venture = updatedVenture;
      }

      emit();
      return state;
    } catch (err: any) {
      console.error(`[MultiAgentOrchestrator] Red Team Agent execution failed for venture ${ventureId}:`, err);
      state.agentWorkflow.redTeam = {
        status: 'failed',
        error: err.message || 'Red team adversarial analysis failed. Please retry.'
      };
      state.analysisStatus = 'failed';
      emit();
      throw err;
    }
  }

  /**
   * Executes the Phase 6 Judge Agent independently using existing venture, research, business & red team data
   */
  public async executeJudgeAgentOnly(
    ventureId: string,
    onProgress?: OrchestrationEventCallback
  ): Promise<VentureAnalysisState> {
    const currentState = await this.getAnalysisState(ventureId);
    if (!currentState) {
      throw new Error(`Venture with ID "${ventureId}" not found.`);
    }

    const state = { ...currentState };
    state.analysisStatus = 'running';
    state.agentWorkflow.judge = { status: 'running', startedAt: new Date().toISOString() };

    const emit = () => {
      if (onProgress) onProgress({ ...state });
    };
    emit();

    try {
      const judgeOutput = await this.judgeAgent.synthesize({
        ventureId: state.venture.id,
        ventureTitle: state.venture.title,
        ventureDescription: state.venture.description,
        targetAudience: state.venture.targetAudience,
        monetizationIdea: state.venture.monetizationIdea,
        rawIdea: state.venture.rawIdea,
        problem: state.venture.problem,
        solution: state.venture.solution,
        targetCustomer: state.venture.targetCustomer,
        marketGeography: state.venture.marketGeography,
        businessModel: state.venture.businessModel,
        technology: state.venture.technology,
        founderAssumptions: state.venture.founderAssumptions,
        importantUnknowns: state.venture.importantUnknowns,
        founderContext: state.venture.founderContext,
        answeredQuestions: state.criticalQuestions.filter(q => q.status === 'ANSWERED'),
        researchReport: state.researchReport || undefined,
        businessReport: state.businessReport || undefined,
        redTeamReport: state.redTeamReport || undefined,
        venture: state.venture
      });

      const judgeReportId = `jr_${Date.now()}`;
      const savedJudgeReport = await this.repo.saveJudgeReport(ventureId, {
        ...judgeOutput.report,
        id: judgeReportId,
        ventureId,
        createdAt: new Date().toISOString()
      });

      const savedActions = await this.repo.saveNextActions(ventureId, savedJudgeReport.nextActions || []);

      const computedScore = ScoringEngine.calculate(
        ventureId,
        undefined,
        state.researchReport,
        state.businessReport,
        state.redTeamReport
      );
      const savedScore = await this.repo.saveVentureScore(ventureId, computedScore);

      const judgeRecord = this.createCollaborationRecord({
        agent: 'JUDGE',
        ventureId,
        inputContext: {
          researchReportId: state.researchReport?.id,
          businessReportId: state.businessReport?.id,
          redTeamReportId: state.redTeamReport?.id
        },
        previousAgentReference: [
          ...(state.researchReport ? [state.researchReport.id] : []),
          ...(state.businessReport ? [state.businessReport.id] : []),
          ...(state.redTeamReport ? [state.redTeamReport.id] : [])
        ],
        researchSources: (savedJudgeReport.sourceReferences || []).map(s => ({ id: s.id, title: s.title, publisher: s.publisher })),
        keyFindings: [
          `AI Recommendation: ${savedJudgeReport.aiRecommendation}`,
          savedJudgeReport.coreVentureThesis?.statement || savedJudgeReport.executiveSummary
        ],
        assumptions: savedJudgeReport.criticalAssumptions || [],
        confidence: savedJudgeReport.recommendationConfidence,
        status: 'COMPLETED'
      });

      state.judgeReport = savedJudgeReport;
      state.nextActions = savedActions;
      state.scores = savedScore;
      state.collaborationRecords = [
        ...(state.collaborationRecords || []).filter(r => r.agent !== 'JUDGE'),
        judgeRecord
      ];
      state.agentWorkflow.judge = {
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      state.analysisStatus = 'completed';

      await this.repo.update(ventureId, {
        status: 'evaluated',
        judgeReport: savedJudgeReport,
        nextActions: savedActions,
        score: savedScore,
        collaborationRecords: state.collaborationRecords
      });

      const updatedVenture = await this.repo.findById(ventureId);
      if (updatedVenture) {
        state.venture = updatedVenture;
      }

      emit();
      return state;
    } catch (err: any) {
      console.error(`[MultiAgentOrchestrator] Judge Agent execution failed for venture ${ventureId}:`, err);
      state.agentWorkflow.judge = {
        status: 'failed',
        error: err.message || 'Judge synthesis failed. Please retry.'
      };
      state.analysisStatus = 'failed';
      emit();
      throw err;
    }
  }
}

export const multiAgentOrchestrator = new MultiAgentOrchestrator();

