/**
 * Multi-Agent Orchestrator
 * 
 * Coordinates the sequential DAG workflow across the 4 specialized agents:
 * Venture -> Research Agent -> Business Agent -> Red Team Agent -> Judge Agent -> Scoring Engine
 * 
 * Enforces:
 * 1. Independent Evidence Verification Layer (Levels 1 - 4)
 * 2. Chain of Thought (CoT) Preambles and Reasoning Extraction
 * 3. Provenance Tracking (agent_run_id generation and cross-agent linking)
 * 4. Hard Decision Gate (restricting high-confidence BUILD recommendations when research is unverified)
 * 5. Structured Data Handoffs and Persistence
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
import { 
  NextAction, 
  CollaborationRecord, 
  ConfidenceLevel,
  AgentRunRecord,
  EvidenceVerificationReport,
  AgentChainStatus
} from '../types/domain';
import { evidenceVerificationService } from '../server/verification/evidenceVerificationService';
import { chainOfThoughtWrapper } from '../server/verification/chainOfThoughtWrapper';

export type OrchestrationEventCallback = (state: VentureAnalysisState) => void;

interface CachedOrchestratorResult {
  researchReport: any;
  businessReport: any;
  redTeamReport: any;
  judgeReport: any;
  score: any;
  nextActions: any[];
  collaborationRecords: any[];
  agentRunRecords: any[];
  agentChainStatus: any;
  evidenceVerificationReport: any;
}

export class MultiAgentOrchestrator {
  private static serverMemoCache: Map<string, CachedOrchestratorResult> = new Map();

  private static computeVentureSignature(venture: any): string {
    const normTitle = (venture?.title || '').toLowerCase().trim();
    const normIdea = (venture?.rawIdea || venture?.description || `${venture?.problem || ''} ${venture?.solution || ''}`).toLowerCase().trim();
    const normCustomer = (venture?.targetCustomer || venture?.targetAudience || '').toLowerCase().trim();
    const normGeo = (venture?.marketGeography || '').toLowerCase().trim();
    const normContext = (venture?.businessModel || venture?.monetizationIdea || '').toLowerCase().trim();

    const answers = (venture?.questions || [])
      .filter((q: any) => (q.status === 'ANSWERED' || q.answer) && q.answer)
      .map((q: any) => `${q.id}:${q.answer}`)
      .sort()
      .join(';');

    return `title=${normTitle}|idea=${normIdea}|cust=${normCustomer}|geo=${normGeo}|ctx=${normContext}|ans=${answers}`;
  }

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
   * Executes the full 4-agent pipeline with Chain of Thought & Evidence Verification Protocol
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

    // Check if an identical idea has already been evaluated in server cache
    const signature = MultiAgentOrchestrator.computeVentureSignature(venture);
    const cachedResult = MultiAgentOrchestrator.serverMemoCache.get(signature);

    if (cachedResult) {
      console.log(`[MultiAgentOrchestrator] 🎯 Server Cache HIT for venture "${venture.title}" (Signature: ${signature}). Reusing deterministic reports and score (${cachedResult.score?.totalScore}/100).`);

      state.researchReport = cachedResult.researchReport;
      state.businessReport = cachedResult.businessReport;
      state.redTeamReport = cachedResult.redTeamReport;
      state.judgeReport = cachedResult.judgeReport;
      state.scores = cachedResult.score;
      state.nextActions = cachedResult.nextActions;
      state.collaborationRecords = cachedResult.collaborationRecords;
      state.agentWorkflow = {
        research: { status: 'completed', completedAt: new Date().toISOString() },
        business: { status: 'completed', completedAt: new Date().toISOString() },
        redTeam: { status: 'completed', completedAt: new Date().toISOString() },
        judge: { status: 'completed', completedAt: new Date().toISOString() }
      };
      state.analysisStatus = 'completed';
      state.lifecycleStatus = 'evaluated';

      await this.repo.update(ventureId, {
        status: 'evaluated',
        researchReport: cachedResult.researchReport,
        businessReport: cachedResult.businessReport,
        redTeamReport: cachedResult.redTeamReport,
        judgeReport: cachedResult.judgeReport,
        nextActions: cachedResult.nextActions,
        score: cachedResult.score,
        collaborationRecords: cachedResult.collaborationRecords,
        agentRunRecords: cachedResult.agentRunRecords,
        agentChainStatus: cachedResult.agentChainStatus,
        evidenceVerificationReport: cachedResult.evidenceVerificationReport
      });

      const updated = await this.repo.findById(ventureId);
      if (updated) {
        state.venture = updated;
      }
      emit();
      return state;
    }

    // Tracking run records throughout this pipeline run
    const collectedRunRecords: AgentRunRecord[] = [];

    try {
      // ----------------------------------------------------
      // PHASE 3: RESEARCH AGENT EXECUTION
      // ----------------------------------------------------
      state.agentWorkflow.research = { status: 'running', startedAt: new Date().toISOString() };
      emit();

      const researchRunId = evidenceVerificationService.generateAgentRunId('RESEARCH', ventureId);

      const researchOutput = await this.researchAgent.analyze({
        ventureId: venture.id,
        agentRunId: researchRunId,
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

      // Verification Protocol Check for Research
      const researchVerification = evidenceVerificationService.verifyResearchExecution(
        researchOutput.report,
        researchRunId,
        ventureId,
        false
      );
      collectedRunRecords.push(researchVerification.runRecord);

      // Chain of Thought Extraction
      const researchCoT = chainOfThoughtWrapper.extractChainOfThought('RESEARCH', researchOutput.report);

      const reportId = `rr_${Date.now()}`;
      const savedResearchReport = await this.repo.saveResearchReport(ventureId, {
        ...researchOutput.report,
        id: reportId,
        ventureId,
        agentRunId: researchRunId,
        chainOfThought: researchCoT,
        createdAt: new Date().toISOString()
      });

      const researchRecord = this.createCollaborationRecord({
        agent: 'RESEARCH',
        ventureId,
        inputContext: {
          title: venture.title,
          problem: venture.problem,
          solution: venture.solution,
          targetCustomer: venture.targetCustomer || venture.targetAudience,
          agentRunId: researchRunId
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

      // Update Venture lifecycle state with research report and run records
      await this.repo.update(ventureId, { 
        status: 'analyzing',
        researchReport: savedResearchReport,
        collaborationRecords: state.collaborationRecords,
        agentRunRecords: collectedRunRecords
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

      let savedBusinessReport: any = null;
      let businessRunId = '';
      let businessVerification: any = null;

      try {
        businessRunId = evidenceVerificationService.generateAgentRunId('BUSINESS', ventureId);

        const businessOutput = await this.businessAgent.evaluate({
          ventureId: venture.id,
          agentRunId: businessRunId,
          researchAgentRunId: researchRunId,
          verificationWarnings: researchVerification.warnings,
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

        // Verification Protocol Check for Business
        businessVerification = evidenceVerificationService.verifyBusinessExecution(
          businessOutput.report,
          businessRunId,
          ventureId,
          researchRunId,
          researchVerification.status
        );
        collectedRunRecords.push(businessVerification.runRecord);

        // Chain of Thought Extraction
        const businessCoT = chainOfThoughtWrapper.extractChainOfThought('BUSINESS', businessOutput.report, savedResearchReport);

        const businessReportId = `br_${Date.now()}`;
        savedBusinessReport = await this.repo.saveBusinessReport(ventureId, {
          ...businessOutput.report,
          id: businessReportId,
          ventureId,
          agentRunId: businessRunId,
          chainOfThought: businessCoT,
          createdAt: new Date().toISOString()
        });

        const businessRecord = this.createCollaborationRecord({
          agent: 'BUSINESS',
          ventureId,
          inputContext: {
            researchReportId: savedResearchReport.id,
            businessModel: state.venture.businessModel,
            monetizationIdea: state.venture.monetizationIdea,
            agentRunId: businessRunId,
            previousAgentRunId: researchRunId
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

        // Update Venture lifecycle state with business report and updated runs
        await this.repo.update(ventureId, {
          status: 'analyzing',
          businessReport: savedBusinessReport,
          collaborationRecords: state.collaborationRecords,
          agentRunRecords: collectedRunRecords
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

      let savedRedTeamReport: any = null;
      let redTeamRunId = '';
      let redTeamVerification: any = null;

      try {
        redTeamRunId = evidenceVerificationService.generateAgentRunId('RED_TEAM', ventureId);

        const accumulatedWarnings = [
          ...researchVerification.warnings,
          ...(businessVerification ? businessVerification.warnings : [])
        ];

        const redTeamOutput = await this.redTeamAgent.challenge({
          ventureId: venture.id,
          agentRunId: redTeamRunId,
          researchAgentRunId: researchRunId,
          businessAgentRunId: businessRunId,
          verificationWarnings: accumulatedWarnings,
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

        // Verification Protocol Check for Red Team
        redTeamVerification = evidenceVerificationService.verifyRedTeamExecution(
          redTeamOutput.report,
          redTeamRunId,
          ventureId,
          researchRunId,
          businessRunId
        );
        collectedRunRecords.push(redTeamVerification.runRecord);

        // Chain of Thought Extraction
        const redTeamCoT = chainOfThoughtWrapper.extractChainOfThought('RED_TEAM', redTeamOutput.report);

        const redTeamReportId = `rt_${Date.now()}`;
        savedRedTeamReport = await this.repo.saveRedTeamReport(ventureId, {
          ...redTeamOutput.report,
          id: redTeamReportId,
          ventureId,
          agentRunId: redTeamRunId,
          chainOfThought: redTeamCoT,
          createdAt: new Date().toISOString()
        });

        const redTeamRecord = this.createCollaborationRecord({
          agent: 'RED_TEAM',
          ventureId,
          inputContext: {
            researchReportId: state.researchReport?.id,
            businessReportId: state.businessReport?.id,
            agentRunId: redTeamRunId,
            previousRuns: [researchRunId, businessRunId]
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

        // Update Venture lifecycle state with red team report and updated runs
        await this.repo.update(ventureId, {
          status: 'analyzing',
          redTeamReport: savedRedTeamReport,
          collaborationRecords: state.collaborationRecords,
          agentRunRecords: collectedRunRecords
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
      // PHASE 6: JUDGE AGENT SYNTHESIS & HARD DECISION GATE
      // ----------------------------------------------------
      state.agentWorkflow.judge = { status: 'running', startedAt: new Date().toISOString() };
      emit();

      try {
        const judgeRunId = evidenceVerificationService.generateAgentRunId('JUDGE', ventureId);

        const allUpstreamWarnings = [
          ...researchVerification.warnings,
          ...(businessVerification ? businessVerification.warnings : []),
          ...(redTeamVerification ? redTeamVerification.warnings : [])
        ];

        const judgeOutput = await this.judgeAgent.synthesize({
          ventureId: venture.id,
          agentRunId: judgeRunId,
          researchAgentRunId: researchRunId,
          businessAgentRunId: businessRunId,
          redTeamAgentRunId: redTeamRunId,
          verificationWarnings: allUpstreamWarnings,
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

        // Verification Protocol & Hard Decision Gate for Judge
        const judgeVerification = evidenceVerificationService.verifyJudgeAndEnforceGate(
          judgeOutput.report,
          judgeRunId,
          ventureId,
          {
            research: researchVerification?.runRecord,
            business: businessVerification?.runRecord,
            redTeam: redTeamVerification?.runRecord
          },
          judgeOutput.report.aiRecommendation
        );
        collectedRunRecords.push(judgeVerification.runRecord);

        // Chain of Thought Extraction
        const judgeCoT = chainOfThoughtWrapper.extractChainOfThought('JUDGE', judgeOutput.report);

        const judgeReportId = `jr_${Date.now()}`;
        const finalReportData = {
          ...judgeOutput.report,
          id: judgeReportId,
          ventureId,
          agentRunId: judgeRunId,
          chainOfThought: judgeCoT,
          aiRecommendation: judgeVerification.finalRecommendation,
          evidenceVerificationReport: judgeVerification.verificationReport,
          createdAt: new Date().toISOString()
        };

        const savedJudgeReport = await this.repo.saveJudgeReport(ventureId, finalReportData);
        const savedActions = await this.repo.saveNextActions(ventureId, savedJudgeReport.nextActions || []);

        // Calculate deterministic readiness score
        const computedScore = ScoringEngine.calculate(
          ventureId,
          judgeOutput.rawScoreInput,
          state.researchReport,
          state.businessReport,
          state.redTeamReport,
          state.venture
        );
        const savedScore = await this.repo.saveVentureScore(ventureId, computedScore);

        const judgeRecord = this.createCollaborationRecord({
          agent: 'JUDGE',
          ventureId,
          inputContext: {
            researchReportId: state.researchReport?.id,
            businessReportId: state.businessReport?.id,
            redTeamReportId: state.redTeamReport?.id,
            agentRunId: judgeRunId,
            previousRuns: [researchRunId, businessRunId, redTeamRunId]
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

        // Update Venture lifecycle state to evaluated with verified provenance metadata
        await this.repo.update(ventureId, {
          status: 'evaluated',
          judgeReport: savedJudgeReport,
          nextActions: savedActions,
          score: savedScore,
          collaborationRecords: state.collaborationRecords,
          agentRunRecords: collectedRunRecords,
          agentChainStatus: judgeVerification.chainStatus,
          evidenceVerificationReport: judgeVerification.verificationReport
        });

        updatedVenture = await this.repo.findById(ventureId);
        if (updatedVenture) {
          state.venture = updatedVenture;
        }

        // Cache the successful evaluated result by signature for reproducible instant runs
        MultiAgentOrchestrator.serverMemoCache.set(signature, {
          researchReport: savedResearchReport,
          businessReport: savedBusinessReport,
          redTeamReport: savedRedTeamReport,
          judgeReport: savedJudgeReport,
          score: savedScore,
          nextActions: savedActions,
          collaborationRecords: state.collaborationRecords,
          agentRunRecords: collectedRunRecords,
          agentChainStatus: judgeVerification.chainStatus,
          evidenceVerificationReport: judgeVerification.verificationReport
        });

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
      const researchRunId = state.researchReport?.agentRunId;
      const businessRunId = evidenceVerificationService.generateAgentRunId('BUSINESS', ventureId);

      const businessOutput = await this.businessAgent.evaluate({
        ventureId: state.venture.id,
        agentRunId: businessRunId,
        researchAgentRunId: researchRunId,
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

      const businessVerification = evidenceVerificationService.verifyBusinessExecution(
        businessOutput.report,
        businessRunId,
        ventureId,
        researchRunId,
        state.researchReport ? 'VERIFIED' : 'UNVERIFIED'
      );

      const businessCoT = chainOfThoughtWrapper.extractChainOfThought('BUSINESS', businessOutput.report, state.researchReport);

      const businessReportId = `br_${Date.now()}`;
      const savedBusinessReport = await this.repo.saveBusinessReport(ventureId, {
        ...businessOutput.report,
        id: businessReportId,
        ventureId,
        agentRunId: businessRunId,
        chainOfThought: businessCoT,
        createdAt: new Date().toISOString()
      });

      const businessRecord = this.createCollaborationRecord({
        agent: 'BUSINESS',
        ventureId,
        inputContext: {
          researchReportId: state.researchReport?.id,
          businessModel: state.venture.businessModel,
          monetizationIdea: state.venture.monetizationIdea,
          agentRunId: businessRunId,
          researchRunId
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

      const existingRuns = state.venture.agentRunRecords || [];
      const updatedRuns = [
        ...existingRuns.filter(r => r.agentName !== 'BUSINESS'),
        businessVerification.runRecord
      ];

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
        collaborationRecords: state.collaborationRecords,
        agentRunRecords: updatedRuns
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
      const researchRunId = state.researchReport?.agentRunId;
      const businessRunId = state.businessReport?.agentRunId;
      const redTeamRunId = evidenceVerificationService.generateAgentRunId('RED_TEAM', ventureId);

      const redTeamOutput = await this.redTeamAgent.challenge({
        ventureId: state.venture.id,
        agentRunId: redTeamRunId,
        researchAgentRunId: researchRunId,
        businessAgentRunId: businessRunId,
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

      const redTeamVerification = evidenceVerificationService.verifyRedTeamExecution(
        redTeamOutput.report,
        redTeamRunId,
        ventureId,
        researchRunId,
        businessRunId
      );

      const redTeamCoT = chainOfThoughtWrapper.extractChainOfThought('RED_TEAM', redTeamOutput.report);

      const redTeamReportId = `rt_${Date.now()}`;
      const savedRedTeamReport = await this.repo.saveRedTeamReport(ventureId, {
        ...redTeamOutput.report,
        id: redTeamReportId,
        ventureId,
        agentRunId: redTeamRunId,
        chainOfThought: redTeamCoT,
        createdAt: new Date().toISOString()
      });

      const redTeamRecord = this.createCollaborationRecord({
        agent: 'RED_TEAM',
        ventureId,
        inputContext: {
          researchReportId: state.researchReport?.id,
          businessReportId: state.businessReport?.id,
          agentRunId: redTeamRunId,
          previousRuns: [researchRunId, businessRunId]
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

      const existingRuns = state.venture.agentRunRecords || [];
      const updatedRuns = [
        ...existingRuns.filter(r => r.agentName !== 'RED_TEAM'),
        redTeamVerification.runRecord
      ];

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
        collaborationRecords: state.collaborationRecords,
        agentRunRecords: updatedRuns
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
      const researchRunId = state.researchReport?.agentRunId;
      const businessRunId = state.businessReport?.agentRunId;
      const redTeamRunId = state.redTeamReport?.agentRunId;
      const judgeRunId = evidenceVerificationService.generateAgentRunId('JUDGE', ventureId);

      const judgeOutput = await this.judgeAgent.synthesize({
        ventureId: state.venture.id,
        agentRunId: judgeRunId,
        researchAgentRunId: researchRunId,
        businessAgentRunId: businessRunId,
        redTeamAgentRunId: redTeamRunId,
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

      const existingRuns = state.venture.agentRunRecords || [];
      const researchRun = existingRuns.find(r => r.agentName === 'RESEARCH');
      const businessRun = existingRuns.find(r => r.agentName === 'BUSINESS');
      const redTeamRun = existingRuns.find(r => r.agentName === 'RED_TEAM');

      const judgeVerification = evidenceVerificationService.verifyJudgeAndEnforceGate(
        judgeOutput.report,
        judgeRunId,
        ventureId,
        {
          research: researchRun,
          business: businessRun,
          redTeam: redTeamRun
        },
        judgeOutput.report.aiRecommendation
      );

      const judgeCoT = chainOfThoughtWrapper.extractChainOfThought('JUDGE', judgeOutput.report);

      const judgeReportId = `jr_${Date.now()}`;
      const finalReportData = {
        ...judgeOutput.report,
        id: judgeReportId,
        ventureId,
        agentRunId: judgeRunId,
        chainOfThought: judgeCoT,
        aiRecommendation: judgeVerification.finalRecommendation,
        evidenceVerificationReport: judgeVerification.verificationReport,
        createdAt: new Date().toISOString()
      };

      const savedJudgeReport = await this.repo.saveJudgeReport(ventureId, finalReportData);
      const savedActions = await this.repo.saveNextActions(ventureId, savedJudgeReport.nextActions || []);

      const computedScore = ScoringEngine.calculate(
        ventureId,
        judgeOutput.rawScoreInput,
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
          redTeamReportId: state.redTeamReport?.id,
          agentRunId: judgeRunId,
          previousRuns: [researchRunId, businessRunId, redTeamRunId]
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

      const updatedRuns = [
        ...existingRuns.filter(r => r.agentName !== 'JUDGE'),
        judgeVerification.runRecord
      ];

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
        collaborationRecords: state.collaborationRecords,
        agentRunRecords: updatedRuns,
        agentChainStatus: judgeVerification.chainStatus,
        evidenceVerificationReport: judgeVerification.verificationReport
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
