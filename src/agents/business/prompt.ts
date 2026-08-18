/**
 * Business Agent Runtime Prompt Specification (Phase 4)
 * 
 * Strict Evidence-First Business and Commercial Viability Evaluation
 */

import { ResearchReport } from '../../types/domain';

export const BUSINESS_AGENT_SYSTEM_PROMPT = `
You are the BUSINESS AGENT in the Startup Intelligence multi-agent system.

==================================================
1. YOUR SOLE PURPOSE & MANDATE
==================================================
Evaluate the commercial and business viability of the venture using empirical evidence collected by the Research Agent.
Your purpose is NOT to encourage the founder and NOT to make the final startup decision (BUILD/DO NOT PURSUE is reserved strictly for the Judge Agent).

==================================================
2. SINGLE SOURCE OF TRUTH & REASONING CHAIN
==================================================
You receive the canonical venture idea and the empirical findings of the Research Agent.
- Epistemological Role: You produce COMMERCIAL INFERENCES based on empirical research facts.
- You must critically evaluate whether empirical facts support commercial viability.
- Treat founder claims and research assumptions as unverified hypotheses unless supported by transactional evidence.
- If research indicates high problem urgency, that is EVIDENCE; inferring willingness to pay is an INFERENCE that requires validation.

==================================================
3. DOMAIN-SPECIFIC COMMERCIAL ADAPTATION
==================================================
Tailor the commercial model and unit economics to the venture's exact domain:
- B2B SAAS: ACV, CAC payback period (<12 months), Net Revenue Retention (>110%), gross margins (>75%), seat vs usage pricing.
- FINTECH: Take rate (bps), interchange/spread, capital costs, fraud loss provisions, licensing overhead.
- HEALTHCARE / MEDTECH: Payer reimbursement (CPT/HCPCS codes), lengthy hospital procurement cycles (9-18 months), compliance costs.
- MARKETPLACE: Gross Merchandise Value (GMV), net take rate (10-25%), buyer/seller acquisition imbalance, liquidity density.
- HARDWARE: Bill of Materials (BOM), manufacturing gross margin (>50%), warranty reserve, channel margin cuts.
- LOCAL SERVICES: Route density, hourly labor utilization, customer churn, local paid search CAC.
- AI / API WRAPPERS: Token cost per user query, model fine-tuning overhead, pricing power against foundation model API drops.

==================================================
4. STRICT EVIDENCE INTEGRITY RULES
==================================================
- NEVER invent market sizing numbers, customer behavior, willingness-to-pay data, competitor pricing, or revenue projections.
- NEVER invent URLs, publishers, or fake citations.
- If willingness-to-pay has not been validated through real transactions or primary pricing commitments, mark willingnessToPayStatus as "UNVALIDATED" or "UNKNOWN".
- Do NOT convert missing information into optimistic assumptions. If information is unknown, explicitly list it under "unknowns".
- Do NOT force consensus: If research evidence is weak or contradicts the business thesis, state it plainly.

==================================================
5. OUTPUT CONTRACT
==================================================
You MUST respond with a single, strictly valid JSON object matching the BusinessReport schema.
`;

export function buildBusinessAgentUserPrompt(params: {
  title: string;
  description: string;
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
  answeredQuestions: Array<{ question: string; answer: string }>;
  researchReport?: ResearchReport | null;
}): string {
  const competitorContext = params.researchReport?.competitors && params.researchReport.competitors.length > 0
    ? params.researchReport.competitors.map(c => `- ${c.name} (${c.category}): Advantage: ${c.coreAdvantage}; Vulnerability: ${c.coreVulnerability}`).join('\n')
    : 'No structured competitor profiles in research report.';

  const findingsContext = params.researchReport?.findings && params.researchReport.findings.length > 0
    ? params.researchReport.findings.map((f, i) => `Finding ${i + 1} [${f.category}] (${f.evidenceType || 'observed'}): "${f.statement}" -> Implication: ${f.implication}`).join('\n')
    : 'No structured empirical findings in research report.';

  const sourcesContext = params.researchReport?.sources && params.researchReport.sources.length > 0
    ? params.researchReport.sources.map(s => `- [${s.id}] "${s.title}" (${s.publisher}, ${s.publishYear || 'n.d.'}) [Tier: ${s.reliabilityTier}]`).join('\n')
    : 'No upstream sources recorded.';

  return `
Conduct a thorough, evidence-first commercial viability evaluation for this venture:

VENTURE METADATA:
- Title: ${params.title}
- Core Summary: ${params.description}
- Problem Statement: ${params.problem || 'Not specified'}
- Proposed Solution: ${params.solution || 'Not specified'}
- Target Customer / Audience: ${params.targetCustomer || params.targetAudience || 'Not specified'}
- Target Geography: ${params.marketGeography || 'Global'}
- Proposed Monetization: ${params.businessModel || params.monetizationIdea || 'Not specified'}
- Technology Stack / Delivery: ${params.technology || 'Not specified'}
- Founder Assumptions: ${(params.founderAssumptions || []).join('; ') || 'None provided'}
- Important Unknowns: ${(params.importantUnknowns || []).join('; ') || 'None provided'}

FOUNDER CLARIFICATION Q&A:
${params.answeredQuestions && params.answeredQuestions.length > 0
  ? params.answeredQuestions.map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.answer}`).join('\n\n')
  : 'No critical Q&A clarifications recorded.'}

UPSTREAM RESEARCH REPORT CONTEXT:
- Executive Summary: ${params.researchReport?.executiveSummary || 'Research pending'}
- Confidence Level: ${params.researchReport?.confidence || params.researchReport?.confidenceScore || 'MEDIUM'}
- Research Findings:
${findingsContext}
- Competitor Landscape from Research:
${competitorContext}
- Tailwinds: ${(params.researchReport?.tailwinds || []).join('; ') || 'None'}
- Headwinds: ${(params.researchReport?.headwinds || []).join('; ') || 'None'}
- Unvalidated Research Assumptions: ${(params.researchReport?.unvalidatedAssumptions || []).join('; ') || 'None'}
- Upstream Research Sources:
${sourcesContext}

EVALUATION INSTRUCTIONS:
1. Synthesize customer analysis, problem economics, market dynamics, competitive positioning, and business model feasibility.
2. Formulate 3-6 rigorous BusinessAssumptions with importance, evidenceStatus, and concrete validation methods.
3. Identify 3-5 high-impact BusinessRisks with probability, impact, evidence, mitigation, and validation actions.
4. Separate supporting evidence, contradictory evidence, and critical unknowns.
5. If public pricing or benchmark data is known, cite real ranges; otherwise mark willingness-to-pay as UNVALIDATED.
6. Provide a JSON object adhering strictly to the BusinessReport schema.
`.trim();
}
