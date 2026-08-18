/**
 * Agent Contracts & Interfaces for Startup Intelligence
 * 
 * Strict architectural isolation:
 * Input -> Agent Execution -> Strongly Typed Structured Output
 */

import {
  Venture,
  CriticalQuestion,
  ResearchReport,
  BusinessReport,
  RedTeamReport,
  JudgeReport,
  VentureScore,
  NextAction,
  AIRecommendationType,
  ConfidenceLevel
} from './domain';

export type AgentType = 'RESEARCH' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE';

export interface AgentExecutionState {
  agentType: AgentType;
  name: string;
  role: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  summaryNote?: string;
}

// ----------------------------------------------------
// 1. Research Agent Contract
// ----------------------------------------------------

export interface ResearchAgentInput {
  ventureId: string;
  ventureTitle: string;
  ventureDescription: string;
  targetAudience?: string;
  monetizationIdea?: string;
  rawIdea?: string;
  problem?: string | null;
  solution?: string | null;
  targetCustomer?: string | null;
  marketGeography?: string | null;
  businessModel?: string | null;
  technology?: string | null;
  founderAssumptions?: string[];
  importantUnknowns?: string[];
  founderContext?: string;
  answeredQuestions: CriticalQuestion[];
  venture?: Venture;
  analysisState?: any;
}

export interface ResearchAgentOutput {
  report: Omit<ResearchReport, 'id' | 'ventureId' | 'createdAt'>;
  meta: {
    sourcesConsultedCount: number;
    evidenceStrength: 'LOW' | 'MEDIUM' | 'HIGH';
    executionTimeMs: number;
  };
}

export interface IResearchAgent {
  readonly agentType: 'RESEARCH';
  analyze(input: ResearchAgentInput): Promise<ResearchAgentOutput>;
}

// ----------------------------------------------------
// 2. Business Agent Contract
// ----------------------------------------------------

export interface BusinessAgentInput {
  ventureId: string;
  ventureTitle: string;
  ventureDescription: string;
  targetAudience?: string;
  monetizationIdea?: string;
  rawIdea?: string;
  problem?: string | null;
  solution?: string | null;
  targetCustomer?: string | null;
  marketGeography?: string | null;
  businessModel?: string | null;
  technology?: string | null;
  founderAssumptions?: string[];
  importantUnknowns?: string[];
  founderContext?: string;
  answeredQuestions: CriticalQuestion[];
  researchReport?: ResearchReport | null;
  venture?: Venture;
  analysisState?: any;
}

export interface BusinessAgentOutput {
  report: Omit<BusinessReport, 'id' | 'ventureId' | 'createdAt'>;
  meta: {
    unitEconomicsClarity: 'CLEAR' | 'UNCERTAIN' | 'CONTRADICTORY';
    evidenceStrength?: 'LOW' | 'MEDIUM' | 'HIGH';
    sourcesConsultedCount?: number;
    assumptionsCount?: number;
    risksCount?: number;
    executionTimeMs: number;
  };
}

export interface IBusinessAgent {
  readonly agentType: 'BUSINESS';
  evaluate(input: BusinessAgentInput): Promise<BusinessAgentOutput>;
}

// ----------------------------------------------------
// 3. Red Team Agent Contract
// ----------------------------------------------------

export interface RedTeamAgentInput {
  ventureId: string;
  ventureTitle: string;
  ventureDescription: string;
  targetAudience?: string;
  monetizationIdea?: string;
  rawIdea?: string;
  problem?: string | null;
  solution?: string | null;
  targetCustomer?: string | null;
  marketGeography?: string | null;
  businessModel?: string | null;
  technology?: string | null;
  founderAssumptions?: string[];
  importantUnknowns?: string[];
  founderContext?: string;
  answeredQuestions?: CriticalQuestion[];
  researchReport: ResearchReport;
  businessReport: BusinessReport;
  venture?: Venture;
  analysisState?: any;
}

export interface RedTeamAgentOutput {
  report: Omit<RedTeamReport, 'id' | 'ventureId' | 'createdAt'>;
  meta: {
    challengedClaimCount: number;
    criticalRiskCount: number;
    contradictionCount: number;
    failureConditionCount: number;
    highestSeverityDetected: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'LETHAL';
    fatalFlawCount?: number;
    sourcesConsultedCount?: number;
    executionTimeMs: number;
  };
}

export interface IRedTeamAgent {
  readonly agentType: 'RED_TEAM';
  challenge(input: RedTeamAgentInput): Promise<RedTeamAgentOutput>;
}

// ----------------------------------------------------
// 4. Judge Agent Contract
// ----------------------------------------------------

export interface JudgeAgentInput {
  ventureId: string;
  ventureTitle: string;
  ventureDescription: string;
  targetAudience?: string;
  monetizationIdea?: string;
  rawIdea?: string;
  problem?: string | null;
  solution?: string | null;
  targetCustomer?: string | null;
  marketGeography?: string | null;
  businessModel?: string | null;
  technology?: string | null;
  founderAssumptions?: string[];
  importantUnknowns?: string[];
  founderContext?: string;
  answeredQuestions?: CriticalQuestion[];
  researchReport: ResearchReport;
  businessReport: BusinessReport;
  redTeamReport: RedTeamReport;
  venture?: Venture;
  analysisState?: any;
}

export interface JudgeAgentOutput {
  report: Omit<JudgeReport, 'id' | 'ventureId' | 'createdAt'>;
  recommendedActions: Array<Omit<NextAction, 'id' | 'ventureId' | 'completed'>>;
  aiRecommendation: AIRecommendationType;
  meta: {
    sourcesConsultedCount: number;
    findingsEvaluatedCount: number;
    disagreementsCount: number;
    uncertaintiesCount: number;
    confidence: ConfidenceLevel;
    executionTimeMs: number;
  };
  rawScoreInput?: {
    marketScoreRaw: number; // 0-25
    marketReasoning: string;
    businessScoreRaw: number; // 0-25
    businessReasoning: string;
    moatScoreRaw: number; // 0-25
    moatReasoning: string;
    riskScoreRaw: number; // 0-25
    riskReasoning: string;
  };
}

export interface IJudgeAgent {
  readonly agentType: 'JUDGE';
  synthesize(input: JudgeAgentInput): Promise<JudgeAgentOutput>;
}

// ----------------------------------------------------
// Pipeline Orchestration Contract
// ----------------------------------------------------

export interface PipelineProgressEvent {
  ventureId: string;
  currentAgent: AgentType;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  percentage: number;
  message: string;
  timestamp: string;
  payload?: any;
}
