/**
 * Red Team Agent Runtime Prompt Specification (Phase 5)
 * 
 * Adversarial Analytical System Prompt & Context Formatter
 */

import { ResearchReport, BusinessReport, CriticalQuestion } from '../../types/domain';

export const RED_TEAM_AGENT_SYSTEM_PROMPT = `
You are the RED TEAM AGENT in the Startup Intelligence multi-agent system.

YOUR MISSION:
- You are an adversarial analytical intelligence tasked with stress-testing and attempting to break the venture thesis.
- Determine: "What could make this venture fail, and what evidence supports that concern?"
- Challenge and evaluate claims made by:
  1. The Founder (raw idea, problem, solution, assumptions, context)
  2. The Research Agent (empirical findings, competitor profiles, market trends)
  3. The Business Agent (unit economics, willingness-to-pay, pricing, distribution)
- Your goal is NOT to make the founder feel confident or to be cynical for the sake of negativity. Your goal is rigorous, evidence-aware TRUTH.

EPISTEMIC STANDARDS & EVIDENCE INTEGRITY:
1. Distinguish between:
   - "There is evidence this is wrong" (CONTRADICTED)
   - "There is not enough evidence to know" (UNVERIFIED / UNKNOWN)
   - "There is evidence supporting this claim" (SUPPORTED / PARTIALLY_SUPPORTED)
2. Distinguish risk types:
   - "EVIDENCE_BACKED": Supported by empirical data, competitor benchmarks, historical precedents, or verified market dynamics.
   - "HYPOTHESIS": Plausible failure scenario or vulnerability that is logically grounded but lacks empirical proof.
3. Strict Prohibition on Fabrication:
   - NEVER invent fake URLs, fake citations, fake statistics, or fake competitor capabilities.
   - If information is missing, explicitly classify it as "UNKNOWN".
   - Ground challenges in the provided Research Report, Business Report, and Founder context.

ANALYTICAL DIMENSIONS TO INVESTIGATE:
1. Claim Challenging: Extract core claims and challenge their validity, evidence status, and implications.
2. Critical Risks: Identify key failure vulnerabilities across customer, market, competition, pricing, business model, distribution, operations, technology, regulation, execution, data, trust, and adoption.
3. Assumption Attacks: Target high-impact, low-evidence assumptions. Define what would validate vs invalidate them.
4. Contradiction Detection: Identify real contradictions between Founder claims, Research findings, and Business assumptions.
5. Competitive Attack: Evaluate direct competitors, indirect competitors, substitutes, status quo workflows, and the "do-nothing" option. If differentiation cannot be proven, mark as UNVERIFIED_DIFFERENTIATION.
6. Failure Conditions: Construct nuanced "If [condition], then [failure mode]" statements grounded in evidence.
7. Decision-Changing Evidence: Identify critical evidence points that would materially alter an investment/build decision.

OUTPUT:
- Return a valid JSON object matching the complete RedTeamReportSchema.
`.trim();

export function buildRedTeamAgentUserPrompt(params: {
  title: string;
  description: string;
  rawIdea?: string;
  problem?: string | null;
  solution?: string | null;
  targetCustomer?: string | null;
  targetAudience?: string;
  marketGeography?: string | null;
  businessModel?: string | null;
  monetizationIdea?: string;
  technology?: string | null;
  founderAssumptions?: string[];
  importantUnknowns?: string[];
  founderContext?: string;
  answeredQuestions?: Array<{ question: string; answer?: string; category?: string }>;
  researchReport: ResearchReport;
  businessReport: BusinessReport;
}): string {
  const competitorList = (params.researchReport.competitors || []).map(c => 
    `- ${c.name} (${c.category || 'Direct'}): ${c.marketPosition || ''} | Advantage: ${c.coreAdvantage || ''} | Vulnerability: ${c.coreVulnerability || ''}`
  ).join('\n');

  const researchFindings = (params.researchReport.findings || []).map(f =>
    `- [${f.category}] ${f.statement} (Confidence: ${f.confidence}, Implication: ${f.implication})`
  ).join('\n');

  const businessAssumptions = (params.businessReport.businessAssumptions || params.businessReport.assumptions || []).map(a =>
    `- [${a.category}] ${a.statement || a.hypothesis} (Importance: ${a.importance}, Status: ${a.evidenceStatus})`
  ).join('\n');

  const businessRisks = (params.businessReport.businessRisks || params.businessReport.risks || []).map(r =>
    `- ${r.title}: ${r.description || ''} (Prob: ${r.probability}, Impact: ${r.impact || r.severity})`
  ).join('\n');

  const answeredQs = (params.answeredQuestions || []).map(q =>
    `Q: ${q.question}\nA: ${q.answer || 'Not answered'}`
  ).join('\n\n');

  return `
Execute an adversarial Red Team analysis on the following venture:

==================== 1. VENTURE INTAKE & FOUNDER THESIS ====================
TITLE: ${params.title}
DESCRIPTION: ${params.description}
RAW IDEA: ${params.rawIdea || params.description}
PROBLEM: ${params.problem || 'Not explicitly stated'}
SOLUTION: ${params.solution || 'Not explicitly stated'}
TARGET CUSTOMER: ${params.targetCustomer || params.targetAudience || 'Not specified'}
MARKET GEOGRAPHY: ${params.marketGeography || 'Global / Unspecified'}
BUSINESS MODEL / MONETIZATION: ${params.businessModel || params.monetizationIdea || 'Not specified'}
TECHNOLOGY: ${params.technology || 'Not specified'}
FOUNDER ASSUMPTIONS: ${(params.founderAssumptions || []).join('; ') || 'None provided'}
IMPORTANT UNKNOWNS: ${(params.importantUnknowns || []).join('; ') || 'None provided'}
FOUNDER CONTEXT: ${params.founderContext || 'None provided'}

CRITICAL QUESTIONS & ANSWERS:
${answeredQs || 'None provided'}

==================== 2. UPSTREAM RESEARCH REPORT ====================
EXECUTIVE SUMMARY: ${params.researchReport.executiveSummary}
TAILWINDS: ${(params.researchReport.tailwinds || []).join('; ')}
HEADWINDS: ${(params.researchReport.headwinds || []).join('; ')}
COMPETITORS IDENTIFIED:
${competitorList || 'None'}

KEY RESEARCH FINDINGS:
${researchFindings || 'None'}

==================== 3. UPSTREAM BUSINESS REPORT ====================
EXECUTIVE SUMMARY: ${params.businessReport.executiveSummary}
CUSTOMER WTP STATUS: ${params.businessReport.customerAnalysis?.willingnessToPayStatus || 'UNVALIDATED'}
CUSTOMER WTP EVIDENCE: ${params.businessReport.customerAnalysis?.willingnessToPayEvidence || 'None'}
UNIT ECONOMICS: Target Price: ${params.businessReport.businessModel?.unitEconomicsHypothesis?.targetPricePoint || 'N/A'}, Margin: ${params.businessReport.businessModel?.unitEconomicsHypothesis?.estimatedMarginProfile || 'N/A'}
PRIMARY DISTRIBUTION: ${params.businessReport.distributionAnalysis?.primaryChannel || params.businessReport.primaryDistributionChannel || 'N/A'}
DISTRIBUTION BOTTLENECK: ${(params.businessReport.distributionAnalysis?.distributionBottlenecks || []).join('; ') || 'N/A'}
CLAIMED MOAT: ${params.businessReport.defensibilityMoat?.type || 'None'} (Strength: ${params.businessReport.defensibilityMoat?.strength || 'NONE'})

KEY BUSINESS ASSUMPTIONS:
${businessAssumptions || 'None'}

IDENTIFIED BUSINESS RISKS:
${businessRisks || 'None'}

==================== ADVERSARIAL ATTACK INSTRUCTIONS ====================
Analyze and challenge the venture across all 7 core modules:
1. Challenged Claims: Target key assertions made by the founder, research, or business report.
2. Critical Risks: Identify specific failure vectors with severity and riskType ('EVIDENCE_BACKED' vs 'HYPOTHESIS').
3. Assumption Attacks: Attack high-impact unvalidated assumptions.
4. Contradiction Detection: Surface real discrepancies between founder claims, research facts, and commercial models.
5. Competitive Threats: Stress-test against direct rivals, indirect tools, and status-quo inertia.
6. Failure Conditions: Define concrete, evidence-aware failure conditions.
7. Decision-Changing Evidence: Highlight what specific evidence would dictate the future build/kill verdict.

Return the result as structured JSON matching the RedTeamReport schema.
`.trim();
}

