/**
 * Chain of Thought (CoT) Wrapper for Agent Orchestration
 * 
 * Enforces sequential dependency, cross-agent evaluation, and explicit reasoning steps.
 * Prevents generic, repetitive analysis by requiring each agent to systematically critique
 * and build upon the verified outputs of its predecessor.
 */

import {
  ResearchReport,
  BusinessReport,
  RedTeamReport,
  JudgeReport,
  AgentRunRecord,
  VerificationStatus
} from '../../types/domain';

export interface ChainOfThoughtContext {
  ventureTitle: string;
  ventureDescription: string;
  agentName: 'RESEARCH' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE';
  currentRunId: string;
  previousRunIds?: string[];
  verificationWarnings?: string[];
}

export class ChainOfThoughtWrapper {
  /**
   * Builds explicit Chain of Thought instructions to prepend or embed into agent execution prompts.
   */
  public generateReasoningPreamble(context: ChainOfThoughtContext): string {
    const { agentName, currentRunId, previousRunIds = [], verificationWarnings = [] } = context;

    let preamble = `
======================================================================
CHAIN OF THOUGHT EXECUTION PROTOCOL [AGENT: ${agentName}]
- Current Agent Run ID: ${currentRunId}
- Preceding Run Provenance: [${previousRunIds.join(', ') || 'NONE (Initial Research Stage)'}]
======================================================================
`;

    if (verificationWarnings.length > 0) {
      preamble += `
[UPSTREAM VERIFICATION WARNINGS]:
${verificationWarnings.map(w => `- ⚠️ ${w}`).join('\n')}
You MUST take these upstream verification warnings into account and not treat unverified claims as established facts.
`;
    }

    switch (agentName) {
      case 'RESEARCH':
        preamble += `
REASONING STEPS REQUIRED:
1. DECONSTRUCT THESIS: Separate founder assertions from observable facts.
2. MAP INCUMBENT WORKFLOWS: Identify exact current tools, manual workarounds, and status quo inertia.
3. DOMAIN GROUNDING: Calibrate all findings to the specific regulatory, technical, and commercial constraints of this venture.
4. EVIDENCE CITATION: Link every finding to identifiable sources or explicitly flag as [UNSUPPORTED_FINDING].
`;
        break;

      case 'BUSINESS':
        preamble += `
REASONING STEPS REQUIRED:
1. AUDIT RESEARCH FINDINGS: Ingest Research Run (${previousRunIds[0] || 'N/A'}). Identify which empirical findings support vs constrain monetization.
2. WILLINGNESS-TO-PAY ANALYSIS: Test pricing hypotheses against the status quo alternatives identified by the Researcher.
3. UNIT ECONOMICS DERIVATION: Derive domain-specific CAC, payback, and gross margins without relying on generic SaaS templates.
4. ASSUMPTION CLASSIFICATION: Classify any business claim not directly backed by Research as [UNVALIDATED_ASSUMPTION].
`;
        break;

      case 'RED_TEAM':
        preamble += `
REASONING STEPS REQUIRED:
1. CROSS-EXAMINE UPSTREAM RUNS: Ingest Research Run (${previousRunIds[0] || 'N/A'}) and Business Run (${previousRunIds[1] || 'N/A'}).
2. STRESS-TEST UNVALIDATED ASSUMPTIONS: Attack the most fragile hypotheses surfaced by Business and Research.
3. CONTRADICTION DETECTION: Uncover real tensions (e.g. Researcher showing high competition vs Business assuming rapid organic adoption).
4. CONSTRUCT FAILURE MODES: Formulate rigorous "If [condition], then [failure mode]" scenarios grounded in empirical market realities.
`;
        break;

      case 'JUDGE':
        preamble += `
REASONING STEPS REQUIRED:
1. FULL EVIDENCE AUDIT: Review runs [${previousRunIds.join(', ')}]. Distinguish primary evidence, secondary findings, and unverified assumptions.
2. ADJUDICATE CROSS-AGENT TENSIONS: Synthesize where Research, Business, and Red Team agree vs disagree.
3. APPLY HARD DECISION GATE: Check if empirical research is verified. If unverified or unsupported, restrict BUILD to VALIDATE FIRST.
4. SYNTHESIZE 6 CORE QUESTIONS: Formulate the definitive, unambiguous venture verdict and exactly 3 empirical next actions.
`;
        break;
    }

    return preamble.trim();
  }

  /**
   * Extracts and structures the Chain of Thought record from agent execution results.
   */
  public extractChainOfThought(
    agentName: 'RESEARCH' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE',
    report: any,
    precedingContext?: any
  ): {
    inputEvaluation: string;
    precedingAgentCritique?: string;
    reasoningSteps: string[];
    conclusion: string;
  } {
    switch (agentName) {
      case 'RESEARCH':
        return {
          inputEvaluation: `Evaluated founder thesis for "${report.executiveSummary?.substring(0, 100) || 'venture'}" against external industry realities.`,
          precedingAgentCritique: 'Initial fact-finding stage; established empirical baseline and competitor landscape.',
          reasoningSteps: [
            `Identified ${(report.competitors || []).length} direct/indirect competitors and status quo alternatives.`,
            `Collected ${(report.findings || []).length} empirical findings across market and technology dimensions.`,
            `Surfaced ${(report.headwinds || []).length} structural headwinds and ${(report.tailwinds || []).length} macro tailwinds.`
          ],
          conclusion: report.executiveSummary || 'Empirical research completed.'
        };

      case 'BUSINESS':
        return {
          inputEvaluation: `Inherited research findings and evaluated commercial feasibility for business archetype: ${report.businessModel?.archetype || 'Commercial Model'}.`,
          precedingAgentCritique: `Benchmarked customer willingness-to-pay and unit economics against research findings.`,
          reasoningSteps: [
            `Assessed customer severity and willingness to switch from existing alternatives.`,
            `Formulated pricing structure and estimated gross margin profile (${report.businessModel?.unitEconomicsHypothesis?.estimatedMarginProfile || 'N/A'}).`,
            `Audited ${(report.businessAssumptions || []).length} business assumptions and ${(report.businessRisks || []).length} commercial risks.`
          ],
          conclusion: report.executiveSummary || 'Commercial viability evaluation completed.'
        };

      case 'RED_TEAM':
        return {
          inputEvaluation: `Adversarially cross-examined Research and Business models.`,
          precedingAgentCritique: `Challenged ${(report.challengedClaims || []).length} core venture claims and attacked ${(report.assumptionAttacks || []).length} critical assumptions.`,
          reasoningSteps: [
            `Conducted contradiction search between founder optimism and market realities.`,
            `Mapped ${(report.criticalRisks || []).length} critical failure modes and operational risks.`,
            `Formulated ${(report.failureConditions || []).length} empirical failure conditions.`
          ],
          conclusion: report.executiveSummary || 'Adversarial Red Team stress-testing completed.'
        };

      case 'JUDGE':
        return {
          inputEvaluation: `Audited complete 4-agent evidence chain and adjudicated cross-agent tensions.`,
          precedingAgentCritique: `Synthesized Research empirical data, Business unit economics, and Red Team adversarial challenges.`,
          reasoningSteps: [
            `Evaluated evidence hierarchy and source traceability.`,
            `Adjudicated agreements and disagreements between upstream agents.`,
            `Formulated the 6 Core Integrity Questions and exactly 3 empirical next actions.`
          ],
          conclusion: report.executiveSummary || 'Final impartial synthesis completed.'
        };
    }
  }
}

export const chainOfThoughtWrapper = new ChainOfThoughtWrapper();
