/**
 * Shared Venture Analysis State Architecture
 * 
 * Central state structure representing one complete, decoupled venture analysis
 * workflow across all 4 collaborative agents, scoring, and founder governance.
 */

import {
  Venture,
  CriticalQuestion,
  ResearchReport,
  BusinessReport,
  RedTeamReport,
  JudgeReport,
  VentureScore,
  Decision,
  NextAction,
  CollaborationRecord
} from './domain';

export type AgentStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentWorkflowState {
  research: {
    status: AgentStepStatus;
    startedAt?: string;
    completedAt?: string;
    error?: string;
  };
  business: {
    status: AgentStepStatus;
    startedAt?: string;
    completedAt?: string;
    error?: string;
  };
  redTeam: {
    status: AgentStepStatus;
    startedAt?: string;
    completedAt?: string;
    error?: string;
  };
  judge: {
    status: AgentStepStatus;
    startedAt?: string;
    completedAt?: string;
    error?: string;
  };
}

export interface VentureAnalysisState {
  /** Root Venture Metadata */
  venture: Venture;
  
  /** Up to 5 clarification questions */
  criticalQuestions: CriticalQuestion[];
  
  /** Map of question id to founder answer text */
  questionAnswers?: Record<string, string>;

  /** Stage 1: Empirical Fact Finding */
  researchReport?: ResearchReport | null;
  
  /** Stage 2: Commercial & Unit Economics Evaluation */
  businessReport?: BusinessReport | null;
  
  /** Stage 3: Adversarial Vulnerability & Failure Modes */
  redTeamReport?: RedTeamReport | null;
  
  /** Stage 4: Cross-Agent Arbitration & Verdict */
  judgeReport?: JudgeReport | null;
  
  /** Deterministic Venture Readiness Score (0-100) */
  scores?: VentureScore | null;
  
  /** Exactly 3 Recommended Empirical Actions */
  nextActions: NextAction[];
  
  /** Final Founder Decision (Proceed / Pivot / Kill / Defer) */
  decision?: Decision | null;
  
  /** Collaboration records for internal agent audit traceability */
  collaborationRecords?: CollaborationRecord[];
  
  /** Real-time execution telemetry per agent */
  agentWorkflow: AgentWorkflowState;
  
  /** Overall workflow lifecycle status */
  lifecycleStatus: 'draft' | 'clarifying' | 'analyzing' | 'evaluated' | 'decided';

  /** Phase 2 Intake & Question readiness flags */
  intakeStatus: 'draft' | 'ready';
  questionsStatus: 'not_required' | 'pending' | 'completed';
  analysisStatus: 'not_started' | 'running' | 'completed' | 'failed';
}
