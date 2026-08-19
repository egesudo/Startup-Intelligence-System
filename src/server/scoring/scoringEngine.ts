/**
 * Deterministic Scoring Engine for Startup Intelligence
 * 
 * Separates quantitative business rules & scoring math from LLM inference.
 * Calculates transparent 0-100 Venture Readiness Score across 4 quadrants
 * (25 points max per quadrant) with visible itemized deductions.
 * 
 * CORE PRINCIPLE:
 * Score must be evidence-derived, not distribution-targeted.
 * Scores are never artificially constrained to a preferred range.
 * Two ventures with similar scores must have materially similar evidence and risk profiles.
 * Different evidence, market conditions, economics, competition, and validation levels
 * must produce meaningfully different scores across the full 0-100 spectrum.
 */

import {
  ResearchReport,
  BusinessReport,
  RedTeamReport,
  VentureScore
} from '../../types/domain';

export interface RawScoreInput {
  marketScoreRaw: number; // 0-25
  marketReasoning: string;
  businessScoreRaw: number; // 0-25
  businessReasoning: string;
  moatScoreRaw: number; // 0-25
  moatReasoning: string;
  riskScoreRaw: number; // 0-25
  riskReasoning: string;
}

export class ScoringEngine {
  /**
   * Calculates the full VentureScore breakdown using deterministic heuristics
   * and structured agent reports.
   */
  public static calculate(
    ventureId: string,
    raw?: Partial<RawScoreInput>,
    research?: ResearchReport | null,
    business?: BusinessReport | null,
    redTeam?: RedTeamReport | null
  ): VentureScore {
    // ─────────────────────────────────────────────────────────
    // 1. Market Problem Urgency (Max 25 pts)
    // ─────────────────────────────────────────────────────────
    let marketScore = 15; // default neutral starting baseline if no reports
    const marketDeductions: string[] = [];

    if (raw?.marketScoreRaw !== undefined && raw.marketScoreRaw >= 0) {
      marketScore = Math.max(0, Math.min(25, raw.marketScoreRaw));
    } else if (research) {
      // Evidence-derived base from research confidence & source rigor
      const conf = research.confidenceScore || research.confidence || 'MEDIUM';
      const sources = research.sources || [];
      const verifiedSources = sources.filter(s => s.reliabilityTier === 'PRIMARY' || s.reliabilityTier === 'INDUSTRY_REPORT' || s.credibility === 'HIGH');
      
      if (conf === 'HIGH' && verifiedSources.length >= 3) {
        marketScore = 22;
      } else if (conf === 'HIGH' || verifiedSources.length >= 2) {
        marketScore = 19;
      } else if (conf === 'MEDIUM') {
        marketScore = 15;
      } else {
        // LOW confidence or unverified market demand
        marketScore = 10;
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

      // Unvalidated core assumptions
      const unvalidated = research.unvalidatedAssumptions || [];
      if (unvalidated.length >= 3) {
        const deduct = Math.min(6, unvalidated.length * 2);
        marketScore = Math.max(0, marketScore - deduct);
        marketDeductions.push(`-${deduct} pts: ${unvalidated.length} critical unvalidated market assumptions.`);
      } else if (unvalidated.length > 0) {
        marketScore = Math.max(0, marketScore - unvalidated.length * 1);
        marketDeductions.push(`-${unvalidated.length} pts: ${unvalidated.length} unverified customer pain assumption(s).`);
      }

      // Competitor saturation check
      const competitors = research.competitors || [];
      if (competitors.length >= 5) {
        marketScore = Math.max(0, marketScore - 2);
        marketDeductions.push('-2 pts: Highly crowded competitor landscape with entrenched incumbents.');
      }
    }

    marketScore = Math.max(0, Math.min(25, Math.round(marketScore)));

    // ─────────────────────────────────────────────────────────
    // 2. Business Model & Unit Economics Viability (Max 25 pts)
    // ─────────────────────────────────────────────────────────
    let businessScore = 15; // default neutral starting baseline
    const businessDeductions: string[] = [];

    if (raw?.businessScoreRaw !== undefined && raw.businessScoreRaw >= 0) {
      businessScore = Math.max(0, Math.min(25, raw.businessScoreRaw));
    } else if (business) {
      const commEco = business.businessModel?.commercialEconomics;
      const pricingPower = business.pricingPower || commEco?.pricingPower;
      const capReq = business.capitalRequirement || commEco?.capitalIntensity;
      const grossMargin = commEco?.estimatedGrossMargin;

      // Base score derived from Gross Margin and Contribution Economics
      if (grossMargin !== undefined) {
        if (grossMargin >= 80) {
          businessScore = 22;
        } else if (grossMargin >= 65) {
          businessScore = 19;
        } else if (grossMargin >= 50) {
          businessScore = 14;
        } else if (grossMargin >= 30) {
          businessScore = 9;
          businessDeductions.push(`-6 pts: Low gross margin (${grossMargin}%) severely limits operational contribution.`);
        } else {
          businessScore = 5;
          businessDeductions.push(`-12 pts: Sub-30% gross margin (${grossMargin}%) creates acute unit economic drag.`);
        }
      } else {
        businessScore = 16;
      }

      // Pricing Power Adjustment
      if (pricingPower === 'STRONG') {
        businessScore = Math.min(25, businessScore + 2);
      } else if (pricingPower === 'WEAK') {
        businessScore = Math.max(0, businessScore - 5);
        businessDeductions.push('-5 pts: Weak pricing power; vulnerable to commoditization or aggressive discounting.');
      }

      // Capital Requirement & Burn Intensity
      if (capReq === 'HEAVY_CAPEX' || capReq === 'WORKING_CAPITAL_INTENSIVE') {
        businessScore = Math.max(0, businessScore - 4);
        businessDeductions.push('-4 pts: High CapEx/Working capital intensity accelerates runway burn risk.');
      } else if (capReq === 'CAPITAL_LIGHT') {
        businessScore = Math.min(25, businessScore + 1);
      }

      // Payback Period
      if (commEco?.paybackMonths !== undefined) {
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
      if (highRiskAssumptions.length > 0) {
        const deduct = Math.min(6, highRiskAssumptions.length * 2);
        businessScore = Math.max(0, businessScore - deduct);
        businessDeductions.push(`-${deduct} pts: ${highRiskAssumptions.length} unvalidated commercial or unit economic assumption(s).`);
      }
    }

    businessScore = Math.max(0, Math.min(25, Math.round(businessScore)));

    // ─────────────────────────────────────────────────────────
    // 3. Defensibility & Moat (Max 25 pts)
    // ─────────────────────────────────────────────────────────
    let moatScore = 14; // default neutral starting baseline
    const moatDeductions: string[] = [];

    if (raw?.moatScoreRaw !== undefined && raw.moatScoreRaw >= 0) {
      moatScore = Math.max(0, Math.min(25, raw.moatScoreRaw));
    } else if (business) {
      const moat = business.defensibilityMoat;
      const strength = moat?.strength;

      if (strength === 'STRONG') {
        moatScore = 22;
      } else if (strength === 'FRAGILE') {
        moatScore = 9;
        moatDeductions.push('-7 pts: Fragile defensibility moat; feature can be rapidly cloned by incumbents in 3-6 months.');
      } else if (strength === 'NONE') {
        moatScore = 3;
        moatDeductions.push('-15 pts: Zero defensibility moat identified; pure commodity workflow.');
      } else {
        moatScore = 14;
      }

      // Moat type modifiers
      const moatType = moat?.type;
      if (moatType === 'NONE') {
        moatScore = Math.max(0, moatScore - 3);
        moatDeductions.push('-3 pts: Pure commodity tool without network effects or data lock-in.');
      } else if (moatType === 'HIGH_SWITCHING_COST' || moatType === 'NETWORK_EFFECTS' || moatType === 'DATA_LOCKIN') {
        moatScore = Math.min(25, moatScore + 2);
      }
    }

    moatScore = Math.max(0, Math.min(25, Math.round(moatScore)));

    // ─────────────────────────────────────────────────────────
    // 4. Execution & Adversarial Risk Profile (Max 25 pts)
    // ─────────────────────────────────────────────────────────
    let executionScore = 23; // starts from high baseline, penalized directly by empirical vulnerabilities
    const executionDeductions: string[] = [];

    if (raw?.riskScoreRaw !== undefined && raw.riskScoreRaw >= 0) {
      executionScore = Math.max(0, Math.min(25, raw.riskScoreRaw));
    } else if (redTeam) {
      const risks = redTeam.criticalRisks || redTeam.fatalFlaws || [];
      const lethalFlaws = risks.filter(f => f.severity === 'LETHAL' || f.severity === 'CRITICAL');
      const highFlaws = risks.filter(f => f.severity === 'HIGH');
      const mediumFlaws = risks.filter(f => f.severity === 'MEDIUM');

      // Lethal flaws penalty (severe non-linear penalty)
      if (lethalFlaws.length > 0) {
        const deduct = Math.min(16, lethalFlaws.length * 7);
        executionScore = Math.max(0, executionScore - deduct);
        executionDeductions.push(`-${deduct} pts: ${lethalFlaws.length} fatal flaw / lethal vulnerability identified by Red Team.`);
      }

      // High severity failure modes
      if (highFlaws.length > 0) {
        const deduct = Math.min(10, highFlaws.length * 3);
        executionScore = Math.max(0, executionScore - deduct);
        executionDeductions.push(`-${deduct} pts: ${highFlaws.length} high-severity operational or failure mechanism(s).`);
      }

      // Medium flaws
      if (mediumFlaws.length >= 3) {
        executionScore = Math.max(0, executionScore - 3);
        executionDeductions.push(`-3 pts: ${mediumFlaws.length} moderate risk vectors accumulate operational drag.`);
      }

      // Direct contradictions between founder claims and market reality
      const contradictions = redTeam.contradictions || [];
      if (contradictions.length > 0) {
        const deduct = Math.min(6, contradictions.length * 2);
        executionScore = Math.max(0, executionScore - deduct);
        executionDeductions.push(`-${deduct} pts: ${contradictions.length} factual contradiction(s) with market evidence.`);
      }

      // High-probability failure conditions
      const failureConditions = redTeam.failureConditions || [];
      if (failureConditions.length >= 3) {
        executionScore = Math.max(0, executionScore - 3);
        executionDeductions.push(`-3 pts: ${failureConditions.length} distinct failure trigger condition(s) mapped.`);
      }
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
      id: `scr_${Date.now()}`,
      ventureId,
      calculatedAt: new Date().toISOString(),
      totalScore,
      dimensions: {
        marketProblemUrgency: {
          score: marketScore,
          reasoning: raw?.marketReasoning || (
            marketScore >= 20 ? 'Strong empirical demand validation and favorable market tailwinds.' :
            marketScore >= 14 ? 'Moderate market problem urgency with some unvalidated customer demand assumptions.' :
            'Weak or unverified market demand with significant structural headwinds.'
          ),
          deductions: marketDeductions
        },
        businessModelViability: {
          score: businessScore,
          reasoning: raw?.businessReasoning || (
            businessScore >= 20 ? 'High gross margin profile with strong pricing power and capital-efficient payback.' :
            businessScore >= 14 ? 'Viable unit economics requiring customer acquisition cost (CAC) validation.' :
            'Compressed margins, weak pricing power, or high capital burn intensity.'
          ),
          deductions: businessDeductions
        },
        defensibilityMoat: {
          score: moatScore,
          reasoning: raw?.moatReasoning || (
            moatScore >= 20 ? 'Defensible structural moat (proprietary IP, data flywheel, or high switching costs).' :
            moatScore >= 14 ? 'Moderate differentiation with early-mover advantage; workflow integration needed.' :
            'Fragile or non-existent moat; vulnerable to swift incumbent replication.'
          ),
          deductions: moatDeductions
        },
        executionRisk: {
          score: executionScore,
          reasoning: raw?.riskReasoning || (
            executionScore >= 20 ? 'High operational resilience with minimal fatal flaws or lethal failure modes.' :
            executionScore >= 14 ? 'Manageable operational and GTM risks requiring gated pilot testing.' :
            'Critical vulnerabilities, severe fatal flaws, or fatal distribution dependencies identified.'
          ),
          deductions: executionDeductions
        }
      },
      recommendationTier
    };
  }
}

