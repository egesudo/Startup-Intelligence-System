/**
 * Deterministic Scoring Engine for Startup Intelligence
 * 
 * Separates quantitative business rules & scoring math from LLM inference.
 * Calculates transparent 0-100 Venture Readiness Score across 4 quadrants
 * (25 points max per quadrant) with visible itemized deductions.
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
    // 1. Market Problem Urgency (Max 25)
    let marketScore = Math.max(0, Math.min(25, raw?.marketScoreRaw ?? 20));
    const marketDeductions: string[] = [];

    if (research) {
      if (research.confidenceScore === 'LOW' || research.confidence === 'LOW') {
        marketScore = Math.max(0, marketScore - 4);
        marketDeductions.push('-4 pts: Low empirical source confidence or unverified market demand.');
      }
      const unvalidated = research.unvalidatedAssumptions || [];
      if (unvalidated.length >= 3) {
        marketScore = Math.max(0, marketScore - 3);
        marketDeductions.push(`-3 pts: ${unvalidated.length} unvalidated core customer assumptions.`);
      }
    }

    // 2. Business Model Viability (Max 25)
    let businessScore = Math.max(0, Math.min(25, raw?.businessScoreRaw ?? 19));
    const businessDeductions: string[] = [];

    if (business) {
      if (business.pricingPower === 'WEAK') {
        businessScore = Math.max(0, businessScore - 5);
        businessDeductions.push('-5 pts: Weak pricing power; vulnerable to commoditization or aggressive discounting.');
      }
      if (business.capitalRequirement === 'HEAVY_CAPEX') {
        businessScore = Math.max(0, businessScore - 4);
        businessDeductions.push('-4 pts: Heavy capital requirement creates high runway burn risk.');
      }
      const assumptions = business.businessAssumptions || business.assumptions || [];
      const highRiskAssumptions = assumptions.filter(a => a.importance === 'CRITICAL' || a.isHighRisk || a.evidenceStatus === 'unverified' || a.evidenceStatus === 'UNVERIFIED');
      if (highRiskAssumptions.length > 0) {
        const deduct = Math.min(6, highRiskAssumptions.length * 2);
        businessScore = Math.max(0, businessScore - deduct);
        businessDeductions.push(`-${deduct} pts: ${highRiskAssumptions.length} high-risk unit economics assumptions.`);
      }
    }

    // 3. Defensibility & Moat (Max 25)
    let moatScore = Math.max(0, Math.min(25, raw?.moatScoreRaw ?? 18));
    const moatDeductions: string[] = [];

    if (business?.defensibilityMoat) {
      if (business.defensibilityMoat.strength === 'NONE') {
        moatScore = Math.max(0, moatScore - 10);
        moatDeductions.push('-10 pts: Zero defensibility moat identified; easily replicable by competitors.');
      } else if (business.defensibilityMoat.strength === 'FRAGILE') {
        moatScore = Math.max(0, moatScore - 5);
        moatDeductions.push('-5 pts: Fragile moat; network effects or data lock-in unproven.');
      }
    }

    // 4. Execution & Failure Risk (Max 25)
    let executionScore = Math.max(0, Math.min(25, raw?.riskScoreRaw ?? 18));
    const executionDeductions: string[] = [];

    if (redTeam) {
      const risks = redTeam.criticalRisks || [];
      const lethalFlaws = risks.filter(f => f.severity === 'LETHAL' || f.severity === 'CRITICAL');
      const highFlaws = risks.filter(f => f.severity === 'HIGH');
      
      if (lethalFlaws.length > 0) {
        const deduct = Math.min(12, lethalFlaws.length * 6);
        executionScore = Math.max(0, executionScore - deduct);
        executionDeductions.push(`-${deduct} pts: ${lethalFlaws.length} critical vulnerability identified by Red Team.`);
      }
      if (highFlaws.length > 0) {
        const deduct = Math.min(8, highFlaws.length * 3);
        executionScore = Math.max(0, executionScore - deduct);
        executionDeductions.push(`-${deduct} pts: ${highFlaws.length} high-severity failure modes identified.`);
      }
    }

    const totalScore = marketScore + businessScore + moatScore + executionScore;

    // Determine recommendation tier
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
          reasoning: raw?.marketReasoning || 'Market problem urgency & pain validation assessment.',
          deductions: marketDeductions
        },
        businessModelViability: {
          score: businessScore,
          reasoning: raw?.businessReasoning || 'Business model, unit economics & monetization feasibility.',
          deductions: businessDeductions
        },
        defensibilityMoat: {
          score: moatScore,
          reasoning: raw?.moatReasoning || 'Competitive moat, switching cost & defensibility barriers.',
          deductions: moatDeductions
        },
        executionRisk: {
          score: executionScore,
          reasoning: raw?.riskReasoning || 'Adversarial failure risk, operational hurdles & pre-mortem analysis.',
          deductions: executionDeductions
        }
      },
      recommendationTier
    };
  }
}
