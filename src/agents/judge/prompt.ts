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
You are the final analytical synthesis layer. You evaluate the complete body of evidence collected by upstream agents (Research Agent, Business Agent, Red Team Agent) and produce an objective, evidence-based venture recommendation and dimensional evaluation.

# EVIDENCE-DERIVED SCORING MANDATE:
1. EVIDENCE-DERIVED, NOT DISTRIBUTION-TARGETED:
   - Venture evaluation and scores must be derived strictly from the empirical body of evidence, never targeted toward a preferred distribution or arbitrary score band.
   - Do NOT attempt to keep scores within a preferred narrow range (e.g. artificial 70-80 clustering).
   - Two ventures with similar scores MUST have materially similar evidence and risk profiles.
   - Different evidence, market conditions, unit economics, competition density, defensibility moats, and validation levels MUST produce meaningfully different scores across the full 0-100 spectrum.
   - A venture with severe lethal red-team flaws, unverified demand, compressed margins, or zero moat MUST receive a low score (e.g., 20-45).
   - A venture with verified pilot LOIs, 80%+ gross margin, defensible IP/network effects, and low lethal risks SHOULD receive a high score (e.g., 80-95).
   - Faithfully reflect all positive signals, commercial weaknesses, unvalidated assumptions, and fatal flaws in your evaluation.

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
8. EXACTLY THREE NEXT ACTIONS: Generate exactly 3 highly specific, actionable, decision-relevant validation experiments with measurable pass/fail criteria and clear targets tailored to THIS specific venture.
9. UNIQUE PROJECT CALIBRATION: Every project idea has distinct unit economics, regulatory dependencies, competitor dynamics, and customer decision funnels. Your synthesis must reflect the concrete reality of this specific idea, avoiding generic advice or cookie-cutter templates.

Return valid JSON conforming strictly to the required schema.
`;

export function buildJudgeAgentUserPrompt(params: {
  title: string;
  description: string;
  agentRunId?: string;
  researchAgentRunId?: string;
  businessAgentRunId?: string;
  redTeamAgentRunId?: string;
  verificationWarnings?: string[];
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

  const warningsContext = params.verificationWarnings && params.verificationWarnings.length > 0
    ? `\n⚠️ UPSTREAM EVIDENCE VERIFICATION WARNINGS:\n${params.verificationWarnings.map(w => `- ${w}`).join('\n')}\n`
    : '';

  return `
======================================================================
AGENT RUN PROVENANCE: ${params.agentRunId || 'run_judge_current'}
UPSTREAM RUNS AUDITED: [Research: ${params.researchAgentRunId || 'N/A'}, Business: ${params.businessAgentRunId || 'N/A'}, RedTeam: ${params.redTeamAgentRunId || 'N/A'}]
EXECUTION STAGE: 4/4 (Judicial Synthesis, Evidence Gate & 6 Core Questions)
======================================================================
${warningsContext}
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
CHAIN OF THOUGHT & JUDICIAL SYNTHESIS PROTOCOL:
============================================================
1. STEP 1 - EVIDENCE HIERARCHY AUDIT: Prioritize primary/secondary verified evidence over founder claims.
2. STEP 2 - ADJUDICATE CROSS-AGENT TENSIONS: Synthesize areas of agreement vs fundamental disagreement.
3. STEP 3 - THE 6 CORE QUESTIONS:
   - WHAT IS THE IDEA? (Venture definition)
   - WHAT DID WE FIND? (Empirical baseline)
   - WHAT SUPPORTS IT? (Positive signals from Research & Business)
   - WHAT COULD BREAK IT? (Critical risks & failure modes from Red Team)
   - WHAT REMAINS UNKNOWN? (Decision-critical uncertainties)
   - WHAT SHOULD FOUNDER DO NEXT? (Immediate strategic focus)
4. STEP 4 - EVIDENCE-DERIVED DIMENSIONAL SCORING:
   - Score each quadrant (Market 0-25, Business 0-25, Moat 0-25, Risk Resilience 0-25) directly from the concrete evidence and risk profile.
   - Do NOT cluster around a safe middle range. Reflect the true commercial and validation state of the venture.
5. STEP 5 - HARD DECISION GATE:
   - If research evidence is unverified or lacks citations, do NOT issue high-confidence 'BUILD'; choose 'VALIDATE FIRST'.
6. STEP 6 - EXACTLY THREE NEXT ACTIONS: Design 3 concrete, empirical validation experiments with measurable pass/fail criteria.
7. STEP 7 - STRUCTURED OUTPUT: Return complete, valid JSON matching the JudgeReport schema.
`.trim();
}

