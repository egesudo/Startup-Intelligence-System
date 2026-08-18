/**
 * Judge Agent Runtime Prompt Specification (Phase 6)
 * 
 * Impartial analytical synthesizer of Startup Intelligence.
 * Synthesizes the full body of evidence across Research, Business, and Red Team reports,
 * preserves evidence hierarchy and source traceability, adjudicates cross-agent tensions,
 * and generates structured recommendations and exactly 3 empirical next actions.
 */

import { ResearchReport, BusinessReport, RedTeamReport, CriticalQuestion, StructuredVentureUnderstanding } from '../../types/domain';

export const JUDGE_AGENT_SYSTEM_PROMPT = `
You are the JUDGE AGENT in the Startup Intelligence multi-agent venture analysis system.

YOUR ROLE & MANDATE:
You are the final analytical synthesis layer. You evaluate the complete body of evidence collected by upstream agents (Research Agent, Business Agent, Red Team Agent) and produce an objective, evidence-based venture recommendation.

CRITICAL OPERATIONAL PRINCIPLES:
1. SYNTHESIS > SUMMARIZATION: You are NOT a generic summarizer. Adjudicate cross-agent tensions (e.g. Researcher market demand vs Red Team lack of willingness-to-pay). Disagreement is valuable intelligence!
2. EVIDENCE HIERARCHY: Prioritize evidence according to strict hierarchy:
   1. Direct primary evidence (customer interviews, pilot data, audited financials)
   2. Reliable independent secondary evidence (industry analyst reports, SEC filings, peer-reviewed benchmarks)
   3. Multiple consistent sources
   4. Single-source evidence
   5. Logical inference
   6. Founder claims
   7. Hypothesis
   8. Unknown / Insufficient Evidence
3. NO FABRICATION & STRICT TRACEABILITY: Never invent facts, statistics, sources, URLs, competitor information, or market figures. If evidence is insufficient, explicitly state "UNKNOWN" or "INSUFFICIENT EVIDENCE". Connect every conclusion to existing findings and sources.
4. THE 6 CORE INTEGRITY QUESTIONS:
   Your evaluation MUST clearly formulate:
   - WHAT IS THE IDEA? (Canonical definition of the venture)
   - WHAT DID WE FIND? (Empirical baseline and market reality)
   - WHAT SUPPORTS IT? (Strongest positive signals from Research & Business)
   - WHAT COULD BREAK IT? (Fatal flaws, incumbent threats & failure vectors from Red Team)
   - WHAT REMAINS UNKNOWN? (Major decision-critical uncertainties and unvalidated assumptions)
   - WHAT SHOULD THE FOUNDER DO NEXT? (Actionable strategic direction and primary validation focus)
5. RECOMMENDATION OPTIONS:
   - "BUILD": Evidence strongly supports the core thesis and critical uncertainties are sufficiently resolved.
   - "VALIDATE FIRST": Promising opportunity, but key decision-critical uncertainties or risks require empirical testing before capital commitment.
   - "REDESIGN": Original formulation has significant commercial or structural weaknesses, but evidence suggests an altered wedge/model may be viable.
   - "DO NOT PURSUE": Evidence strongly contradicts core thesis or unit economics/incumbent moats make venture continuation unjustified.
6. RECOMMENDATION CONFIDENCE: Evaluate "HIGH", "MEDIUM", or "LOW" based purely on evidence strength and completeness.
7. SEPARATION OF POWERS: The Judge produces an AI Recommendation. The founder makes the final decision.
8. EXACTLY THREE NEXT ACTIONS: Generate exactly 3 highly specific, actionable, decision-relevant validation experiments with measurable pass/fail criteria and clear targets.

Return valid JSON conforming strictly to the required schema.
`;

export function buildJudgeAgentUserPrompt(params: {
  title: string;
  description: string;
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
  answeredQuestions?: Array<{ question: string; answer?: string; category?: string }>;
  researchReport: ResearchReport;
  businessReport: BusinessReport;
  redTeamReport: RedTeamReport;
}): string {
  // Format Research Report findings
  const researchSummary = `
- Executive Summary: ${params.researchReport.executiveSummary || 'N/A'}
- Market Confidence: ${params.researchReport.confidenceScore || params.researchReport.confidence || 'MEDIUM'}
- Competitors: ${(params.researchReport.competitors || []).map(c => `${c.name} (Position: ${c.marketPosition || 'N/A'}, Advantage: ${c.coreAdvantage || 'N/A'}, Weakness: ${c.coreVulnerability || 'N/A'})`).join('; ')}
- Headwinds: ${(params.researchReport.headwinds || []).join('; ')}
- Tailwinds: ${(params.researchReport.tailwinds || []).join('; ')}
- Findings: ${(params.researchReport.findings || []).slice(0, 10).map(f => `[${f.id}] [${f.category}] ${f.statement} (Confidence: ${f.confidence})`).join('; ')}
- Citations/Sources: ${(params.researchReport.sources || []).map(s => `[${s.id}] ${s.title} (${s.reliabilityTier || s.credibility || 'SECONDARY'})`).join('; ')}
`.trim();

  // Format Business Report findings
  const businessAssumptions = params.businessReport.businessAssumptions || params.businessReport.assumptions || [];
  const businessRisks = params.businessReport.businessRisks || params.businessReport.risks || [];
  const businessSummary = `
- Archetype: ${params.businessReport.businessModel?.archetype || params.businessReport.archetype || 'N/A'}
- Margin Profile: ${params.businessReport.businessModel?.unitEconomicsHypothesis?.estimatedMarginProfile || params.businessReport.estimatedMarginProfile || 'N/A'}
- Pricing Power: ${params.businessReport.pricingPower || 'N/A'}
- Defensibility Moat: ${params.businessReport.defensibilityMoat?.type || 'N/A'} (${params.businessReport.defensibilityMoat?.strength || 'N/A'})
- Distribution Strategy: ${params.businessReport.distributionAnalysis?.primaryChannel || params.businessReport.primaryDistributionChannel || 'N/A'}
- Assumptions: ${businessAssumptions.slice(0, 8).map(a => `[${a.id}] (${a.importance}/${a.evidenceStatus}) ${a.statement || a.hypothesis || ''}`).join('; ')}
- Business Risks: ${businessRisks.slice(0, 8).map(r => `[${r.id}] [${r.impact || r.severity || 'HIGH'}] ${r.title}: ${r.description || r.evidence || ''}`).join('; ')}
`.trim();

  // Format Red Team Report findings
  const redTeamSummary = `
- Red Team Summary: ${params.redTeamReport.executiveSummary || 'N/A'}
- Red Team Confidence: ${params.redTeamReport.confidence || 'HIGH'}
- Challenged Claims: ${(params.redTeamReport.challengedClaims || []).slice(0, 6).map(c => `[${c.id}] Claim: "${c.claim}" -> Challenge: ${c.challenge} (${c.evidenceStatus})`).join('; ')}
- Critical Risks/Fatal Flaws: ${(params.redTeamReport.criticalRisks || params.redTeamReport.fatalFlaws || []).slice(0, 6).map(f => `[${f.id}] [${f.severity}] ${f.title || f.vulnerability}: ${f.description || f.failureMechanism}`).join('; ')}
- Assumption Attacks: ${(params.redTeamReport.assumptionAttacks || []).slice(0, 6).map(a => `[${a.id}] ${a.assumption} (Validate if: ${a.whatWouldValidateIt}, Invalidate if: ${a.whatWouldInvalidateIt})`).join('; ')}
- Contradictions: ${(params.redTeamReport.contradictions || []).slice(0, 5).map(ct => `[${ct.id}] ${ct.claimOrAssumption}: Point A (${ct.sourceA}) vs Point B (${ct.sourceB})`).join('; ')}
- Competitive/Status Quo Threats: ${(params.redTeamReport.competitiveThreats || []).slice(0, 5).map(t => `[${t.id}] ${t.competitorOrSubstitute} (${t.threatType}): ${t.whyCustomerWouldNotSwitch}`).join('; ')}
- Failure Conditions: ${(params.redTeamReport.failureConditions || []).slice(0, 5).map(fc => `[${fc.id}] ${fc.condition}`).join('; ')}
- Decision Changing Evidence (Red Team): ${(params.redTeamReport.decisionChangingEvidence || []).slice(0, 5).map(dce => `[${dce.id}] ${dce.evidence} (${dce.direction} impact)`).join('; ')}
`.trim();

  const answeredQuestionsStr = (params.answeredQuestions || []).length > 0
    ? (params.answeredQuestions || []).map(q => `Q: ${q.question}\nA: ${q.answer || 'Not answered'}`).join('\n')
    : 'None answered';

  return `
VENTURE DOSSIER FOR ARBITRATION & JUDICIAL EVALUATION:
Title: ${params.title}
Description: ${params.description}
Raw Founder Input: ${params.rawIdea || params.description}
Structured Problem: ${params.problem || 'Not explicitly stated'}
Structured Solution: ${params.solution || 'Not explicitly stated'}
Target Customer: ${params.targetCustomer || 'Not explicitly stated'}
Geography: ${params.marketGeography || 'Global'}
Business Model: ${params.businessModel || 'Not explicitly stated'}
Technology: ${params.technology || 'Standard stack'}
Founder Assumptions: ${(params.founderAssumptions || []).join('; ') || 'None stated'}
Founder Unknowns: ${(params.importantUnknowns || []).join('; ') || 'None stated'}

FOUNDER QUESTION RESPONSES:
${answeredQuestionsStr}

============================================================
MULTI-AGENT EVIDENCE DOSSIERS:
============================================================

1. RESEARCH AGENT DOSSIER (Empirical Market Data & Benchmarks):
${researchSummary}

2. BUSINESS AGENT DOSSIER (Commercial Viability & Unit Economics):
${businessSummary}

3. RED TEAM AGENT DOSSIER (Adversarial Stress-Testing & Vulnerabilities):
${redTeamSummary}

============================================================
YOUR SYNTHESIS & JUDICIAL PROTOCOL:
============================================================
1. Formulate the Core Venture Thesis with explicit supporting/contradicting evidence and status.
2. Formulate Cross-Agent Assessment comparing Research vs Business vs Red Team positions.
3. Identify Decision-Critical Uncertainties that could alter the recommendation.
4. Specify Decision-Changing Evidence with current status and validation methods.
5. Determine the definitive AI Recommendation ('BUILD' | 'VALIDATE FIRST' | 'REDESIGN' | 'DO NOT PURSUE') with confidence ('HIGH' | 'MEDIUM' | 'LOW') and structured rationale.
6. Design EXACTLY THREE actionable, specific next steps with pass/fail validation metrics.
7. Construct explicit Evidence Traceability mapping each conclusion to Finding IDs and Source IDs.

Execute your protocol and return the complete structured JSON JudgeReport.
`.trim();
}

