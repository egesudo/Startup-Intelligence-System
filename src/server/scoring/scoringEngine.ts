/**
 * Deterministic Scoring Engine for Startup Intelligence
 * 
 * Separates quantitative business rules & scoring math from LLM inference.
 * Calculates transparent 0-100 Venture Readiness Score across 4 linear factors
 * (25 points max per factor) with itemized deductions and human-readable reasoning.
 * 
 * CORE PRINCIPLES:
 * 1. SPECIFIC & LINEAR: 4 Factors * 25 Points = 100 Total Points.
 * 2. DETERMINISTIC & REPEATABLE: Analyzing the same venture idea with the same
 *    inputs produces the exact same score every single time (Score(Idea_A) == Score(Idea_A)).
 * 3. EVIDENCE-DERIVED: Derived objectively from market confidence, unit economics,
 *    defensibility moats, and adversarial risk vectors.
 */

import {
  ResearchReport,
  BusinessReport,
  RedTeamReport,
  VentureScore,
  Venture
} from '../../types/domain';

export interface RawScoreInput {
  marketScoreRaw?: number; // 0-25
  marketReasoning?: string;
  businessScoreRaw?: number; // 0-25
  businessReasoning?: string;
  moatScoreRaw?: number; // 0-25
  moatReasoning?: string;
  riskScoreRaw?: number; // 0-25
  riskReasoning?: string;
}

/**
 * Stable deterministic string hashing (DJB2 algorithm)
 */
function stableHash(str: string): number {
  let hash = 5381;
  const clean = (str || '').trim().toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export class ScoringEngine {
  /**
   * Calculates the full 0-100 VentureScore breakdown using deterministic heuristics,
   * structured agent reports, and linear 4-factor evaluation.
   * 
   * 4 Factors (25 pts each):
   * Factor 1: Market Problem Urgency & Evidence Depth (0-25 pts)
   * Factor 2: Business Model & Unit Economics Viability (0-25 pts)
   * Factor 3: Defensibility & Moat Strength (0-25 pts)
   * Factor 4: Execution & Adversarial Risk Profile (0-25 pts)
   */
  public static calculate(
    ventureId: string,
    raw?: Partial<RawScoreInput> | null,
    research?: ResearchReport | null,
    business?: BusinessReport | null,
    redTeam?: RedTeamReport | null,
    venture?: Partial<Venture> | null
  ): VentureScore {
    // Collect deterministic context text for semantic fingerprinting
    const titleText = (venture?.title || '').trim();
    const rawIdeaText = (venture?.rawIdea || venture?.description || '').trim();
    const problemText = (venture?.problem || '').trim();
    const solutionText = (venture?.solution || '').trim();
    const customerText = (venture?.targetCustomer || venture?.targetAudience || '').trim();
    const businessModelText = (venture?.businessModel || venture?.monetizationIdea || '').trim();

    const fullIdeaSignature = `${titleText}|${rawIdeaText}|${problemText}|${solutionText}|${customerText}|${businessModelText}`;
    const ideaHash = stableHash(fullIdeaSignature);

    // ─────────────────────────────────────────────────────────
    // Factor 1: Market Problem Urgency & Evidence (Max 25 pts)
    // ─────────────────────────────────────────────────────────
    let marketScore = 17; // Neutral baseline for a structured venture idea
    const marketDeductions: string[] = [];

    if (research) {
      const conf = research.confidenceScore || research.confidence || 'MEDIUM';
      const sources = research.sources || [];
      const verifiedSources = sources.filter(s => 
        s.reliabilityTier === 'PRIMARY' || 
        s.reliabilityTier === 'INDUSTRY_REPORT' || 
        s.credibility === 'HIGH'
      );
      
      // Evidence-derived base from research confidence & source rigor
      if (conf === 'HIGH' && verifiedSources.length >= 2) {
        marketScore = 22;
      } else if (conf === 'HIGH' || verifiedSources.length >= 1) {
        marketScore = 19;
      } else if (conf === 'MEDIUM') {
        marketScore = 16;
      } else {
        marketScore = 11;
        marketDeductions.push('-5 pts: Low empirical source confidence or unverified market demand baseline.');
      }

      // Problem urgency & tailwinds vs headwinds
      const tailwinds = research.tailwinds || [];
      const headwinds = research.headwinds || [];
      if (tailwinds.length > headwinds.length + 1) {
        marketScore = Math.min(25, marketScore + 2);
      } else if (headwinds.length > tailwinds.length + 1) {
        marketScore = Math.max(0, marketScore - 3);
        marketDeductions.push(`-3 pts: Significant market headwinds outnumber growth tailwinds (${headwinds.length} headwinds vs ${tailwinds.length} tailwinds).`);
      }

      // Unvalidated core market assumptions
      const unvalidated = research.unvalidatedAssumptions || [];
      if (unvalidated.length >= 3) {
        const deduct = Math.min(5, unvalidated.length * 1.5);
        marketScore = Math.max(0, marketScore - Math.round(deduct));
        marketDeductions.push(`-${Math.round(deduct)} pts: ${unvalidated.length} critical unvalidated market assumptions.`);
      } else if (unvalidated.length > 0) {
        marketScore = Math.max(0, marketScore - unvalidated.length);
        marketDeductions.push(`-${unvalidated.length} pts: ${unvalidated.length} unverified customer pain assumption(s).`);
      }

      // Competitor saturation check
      const competitors = research.competitors || [];
      if (competitors.length >= 5) {
        marketScore = Math.max(0, marketScore - 2);
        marketDeductions.push('-2 pts: Highly crowded competitor landscape with entrenched incumbents.');
      }
    } else {
      // Deterministic evaluation directly from venture input clarity
      if (problemText.length > 30 && customerText.length > 10) {
        marketScore = 18;
      } else if (problemText.length < 15) {
        marketScore = 13;
        marketDeductions.push('-4 pts: Problem statement lacks specific pain-point detail.');
      }
    }

    marketScore = Math.max(0, Math.min(25, Math.round(marketScore)));

    // ─────────────────────────────────────────────────────────
    // Factor 2: Business Model & Unit Economics Viability (Max 25 pts)
    // ─────────────────────────────────────────────────────────
    let businessScore = 17; // Neutral baseline
    const businessDeductions: string[] = [];

    if (business) {
      const commEco = business.businessModel?.commercialEconomics;
      const pricingPower = business.pricingPower || commEco?.pricingPower;
      const capReq = business.capitalRequirement || commEco?.capitalIntensity;
      const grossMargin = commEco?.estimatedGrossMargin;

      // Base score derived from Gross Margin and Contribution Economics
      if (grossMargin !== undefined && typeof grossMargin === 'number') {
        if (grossMargin >= 80) {
          businessScore = 22;
        } else if (grossMargin >= 65) {
          businessScore = 19;
        } else if (grossMargin >= 50) {
          businessScore = 15;
        } else if (grossMargin >= 30) {
          businessScore = 10;
          businessDeductions.push(`-6 pts: Low gross margin (${grossMargin}%) severely limits operational contribution.`);
        } else {
          businessScore = 5;
          businessDeductions.push(`-12 pts: Sub-30% gross margin (${grossMargin}%) creates acute unit economic drag.`);
        }
      } else {
        const archetypeStr = (business.archetype || businessModelText || '').toLowerCase();
        if (archetypeStr.includes('saas') || archetypeStr.includes('software')) {
          businessScore = 19;
        } else if (archetypeStr.includes('marketplace')) {
          businessScore = 16;
        } else {
          businessScore = 16;
        }
      }

      // Pricing Power Adjustment
      if (pricingPower === 'STRONG') {
        businessScore = Math.min(25, businessScore + 2);
      } else if (pricingPower === 'WEAK') {
        businessScore = Math.max(0, businessScore - 4);
        businessDeductions.push('-4 pts: Weak pricing power; vulnerable to commoditization or aggressive discounting.');
      }

      // Capital Requirement & Burn Intensity
      if (capReq === 'HEAVY_CAPEX' || capReq === 'WORKING_CAPITAL_INTENSIVE') {
        businessScore = Math.max(0, businessScore - 4);
        businessDeductions.push('-4 pts: High CapEx/Working capital intensity accelerates runway burn risk.');
      } else if (capReq === 'CAPITAL_LIGHT') {
        businessScore = Math.min(25, businessScore + 1);
      }

      // Payback Period
      if (commEco?.paybackMonths !== undefined && typeof commEco.paybackMonths === 'number') {
        if (commEco.paybackMonths > 18) {
          businessScore = Math.max(0, businessScore - 4);
          businessDeductions.push(`-4 pts: Extended CAC payback period (${commEco.paybackMonths} months > 18 mo).`);
        } else if (commEco.paybackMonths > 12) {
          businessScore = Math.max(0, businessScore - 2);
          businessDeductions.push(`-2 pts: Moderately slow CAC payback (${commEco.paybackMonths} months).`);
        }
      }

      // Unvalidated commercial assumptions
      const assumptions = business.businessAssumptions || business.assumptions || [];
      const highRiskAssumptions = assumptions.filter(a =>
        a.importance === 'CRITICAL' ||
        a.isHighRisk ||
        a.evidenceStatus === 'unverified' ||
        a.evidenceStatus === 'UNVERIFIED' ||
        a.evidenceStatus === 'unknown' ||
        a.evidenceStatus === 'unsupported' ||
        a.evidenceStatus === 'UNSUPPORTED'
      );
      if (highRiskAssumptions.length >= 3) {
        businessScore = Math.max(0, businessScore - 4);
        businessDeductions.push(`-4 pts: ${highRiskAssumptions.length} unvalidated commercial or unit economic assumption(s).`);
      } else if (highRiskAssumptions.length > 0) {
        businessScore = Math.max(0, businessScore - highRiskAssumptions.length * 1.5);
        businessDeductions.push(`-${Math.round(highRiskAssumptions.length * 1.5)} pts: ${highRiskAssumptions.length} unverified commercial assumption(s).`);
      }
    } else {
      if (businessModelText.length > 15) {
        businessScore = 17;
      } else {
        businessScore = 14;
        businessDeductions.push('-3 pts: Monetization model requires preliminary pricing clarity.');
      }
    }

    businessScore = Math.max(0, Math.min(25, Math.round(businessScore)));

    // ─────────────────────────────────────────────────────────
    // Factor 3: Defensibility & Moat Strength (Max 25 pts)
    // ─────────────────────────────────────────────────────────
    let moatScore = 15; // Neutral baseline
    const moatDeductions: string[] = [];

    if (business) {
      const moat = business.defensibilityMoat;
      const strength = moat?.strength;

      if (strength === 'STRONG') {
        moatScore = 22;
      } else if (strength === 'FRAGILE') {
        moatScore = 9;
        moatDeductions.push('-6 pts: Fragile defensibility moat; feature can be rapidly cloned by incumbents in 3-6 months.');
      } else if (strength === 'NONE') {
        moatScore = 4;
        moatDeductions.push('-12 pts: Zero defensibility moat identified; pure commodity workflow.');
      } else {
        moatScore = 15;
      }

      // Moat type modifiers
      const moatType = moat?.type;
      if (moatType === 'NONE') {
        moatScore = Math.max(0, moatScore - 3);
        moatDeductions.push('-3 pts: Pure commodity tool without network effects or data lock-in.');
      } else if (moatType === 'HIGH_SWITCHING_COST' || moatType === 'NETWORK_EFFECTS' || moatType === 'DATA_LOCKIN') {
        moatScore = Math.min(25, moatScore + 2);
      }
    } else {
      const techText = (venture?.technology || solutionText).toLowerCase();
      if (techText.includes('patent') || techText.includes('proprietary') || techText.includes('algorithm') || techText.includes('network')) {
        moatScore = 18;
      } else {
        moatScore = 13;
        moatDeductions.push('-2 pts: Differentiation wedge requires deeper workflow or data lock-in.');
      }
    }

    moatScore = Math.max(0, Math.min(25, Math.round(moatScore)));

    // ─────────────────────────────────────────────────────────
    // Factor 4: Execution & Adversarial Risk Profile (Max 25 pts)
    // ─────────────────────────────────────────────────────────
    let executionScore = 24; // Starts from high baseline, penalized directly by empirical vulnerabilities
    const executionDeductions: string[] = [];

    if (redTeam) {
      const risks = redTeam.criticalRisks || redTeam.fatalFlaws || [];
      const lethalFlaws = risks.filter(f => f.severity === 'LETHAL' || f.severity === 'CRITICAL');
      const highFlaws = risks.filter(f => f.severity === 'HIGH');
      const mediumFlaws = risks.filter(f => f.severity === 'MEDIUM');

      // Lethal flaws penalty (severe linear penalty)
      if (lethalFlaws.length > 0) {
        const deduct = Math.min(14, lethalFlaws.length * 6);
        executionScore = Math.max(0, executionScore - deduct);
        executionDeductions.push(`-${deduct} pts: ${lethalFlaws.length} fatal flaw / lethal vulnerability identified by Red Team.`);
      }

      // High severity failure modes
      if (highFlaws.length > 0) {
        const deduct = Math.min(9, highFlaws.length * 3);
        executionScore = Math.max(0, executionScore - deduct);
        executionDeductions.push(`-${deduct} pts: ${highFlaws.length} high-severity operational or failure mechanism(s).`);
      }

      // Medium flaws
      if (mediumFlaws.length >= 3) {
        executionScore = Math.max(0, executionScore - 2);
        executionDeductions.push(`-2 pts: ${mediumFlaws.length} moderate risk vectors accumulate operational drag.`);
      }

      // Direct contradictions between founder claims and market reality
      const contradictions = redTeam.contradictions || [];
      if (contradictions.length > 0) {
        const deduct = Math.min(5, contradictions.length * 2);
        executionScore = Math.max(0, executionScore - deduct);
        executionDeductions.push(`-${deduct} pts: ${contradictions.length} factual contradiction(s) with market evidence.`);
      }

      // High-probability failure conditions
      const failureConditions = redTeam.failureConditions || [];
      if (failureConditions.length >= 3) {
        executionScore = Math.max(0, executionScore - 2);
        executionDeductions.push(`-2 pts: ${failureConditions.length} distinct failure trigger condition(s) mapped.`);
      }
    } else {
      executionScore = 18;
    }

    executionScore = Math.max(0, Math.min(25, Math.round(executionScore)));

    // ─────────────────────────────────────────────────────────
    // Total Evidence-Derived Score (0-100)
    // ─────────────────────────────────────────────────────────
    const totalScore = marketScore + businessScore + moatScore + executionScore;

    // Recommendation Tier calibrated directly to total evidence-derived score
    let recommendationTier: VentureScore['recommendationTier'] = 'MODERATE_READINESS';
    if (totalScore >= 80) {
      recommendationTier = 'HIGH_READINESS';
    } else if (totalScore >= 60) {
      recommendationTier = 'MODERATE_READINESS';
    } else if (totalScore >= 40) {
      recommendationTier = 'HIGH_VULNERABILITY';
    } else {
      recommendationTier = 'CRITICALLY_FLAWED';
    }

    return {
      id: `scr_${ventureId}_${ideaHash}`,
      ventureId,
      calculatedAt: new Date().toISOString(),
      totalScore,
      dimensions: {
        marketProblemUrgency: {
          score: marketScore,
          reasoning: raw?.marketReasoning || (
            marketScore >= 20 ? 'Strong empirical demand validation and favorable market tailwinds.' :
            marketScore >= 15 ? 'Moderate market problem urgency with some unvalidated customer demand assumptions.' :
            'Weak or unverified market demand with significant structural headwinds.'
          ),
          deductions: marketDeductions
        },
        businessModelViability: {
          score: businessScore,
          reasoning: raw?.businessReasoning || (
            businessScore >= 20 ? 'High gross margin profile with strong pricing power and capital-efficient payback.' :
            businessScore >= 15 ? 'Viable unit economics requiring customer acquisition cost (CAC) validation.' :
            'Compressed margins, weak pricing power, or high capital burn intensity.'
          ),
          deductions: businessDeductions
        },
        defensibilityMoat: {
          score: moatScore,
          reasoning: raw?.moatReasoning || (
            moatScore >= 20 ? 'Defensible structural moat (proprietary IP, data flywheel, or high switching costs).' :
            moatScore >= 15 ? 'Moderate differentiation with early-mover advantage; workflow integration needed.' :
            'Fragile or non-existent moat; vulnerable to swift incumbent replication.'
          ),
          deductions: moatDeductions
        },
        executionRisk: {
          score: executionScore,
          reasoning: raw?.riskReasoning || (
            executionScore >= 20 ? 'High operational resilience with minimal fatal flaws or lethal failure modes.' :
            executionScore >= 15 ? 'Manageable operational and GTM risks requiring gated pilot testing.' :
            'Critical vulnerabilities, severe fatal flaws, or fatal distribution dependencies identified.'
          ),
          deductions: executionDeductions
        }
      },
      recommendationTier
    };
  }
}
