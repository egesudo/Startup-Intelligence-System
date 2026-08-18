import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ShieldCheck, 
  Layers, 
  Award, 
  Sliders, 
  Activity, 
  ChevronRight, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  BarChart3,
  RotateCcw
} from 'lucide-react';

export interface MultiScaleScoringProps {
  score: number;
  tier?: string;
  dimensions: {
    problemUrgency: number;
    marketViability: number;
    defensibilityMoat: number;
    executionRisk: number;
  };
  sourcesCount: number;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  deductions?: Array<{ reason: string; points: number }>;
}

export const MultiScaleScoringWidget: React.FC<MultiScaleScoringProps> = ({
  score = 0,
  tier = 'VALIDATE FIRST',
  dimensions,
  sourcesCount = 0,
  confidence = 'HIGH',
  deductions = []
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const [activeScale, setActiveScale] = useState<'STANDARD' | 'IRL' | 'VC_GRADE' | 'RAG_CONFIDENCE' | 'SIMULATOR'>('STANDARD');

  // Custom weights for simulator
  const [weights, setWeights] = useState({
    problemUrgency: 25,
    marketViability: 25,
    defensibilityMoat: 25,
    executionRisk: 25
  });

  // Calculate IRL (Investment Readiness Level: 1 to 9)
  const calculateIRL = (rawScore: number) => {
    if (rawScore >= 85) return { level: 9, label: 'IRL 9: Scalable De-risked Asset', desc: 'Proven PMF, predictable unit economics, defensible competitive moat.' };
    if (rawScore >= 75) return { level: 8, label: 'IRL 8: Commercial Scaling Engine', desc: 'Validated acquisition channels and repeatable customer conversion.' };
    if (rawScore >= 68) return { level: 7, label: 'IRL 7: Product-Market Fit Evidence', desc: 'Sustained retention, strong customer willingness-to-pay.' };
    if (rawScore >= 60) return { level: 6, label: 'IRL 6: Live Pilot & Unit Economics', desc: 'First customer cohorts validating core value proposition.' };
    if (rawScore >= 50) return { level: 5, label: 'IRL 5: Functional MVP & Value Loop', desc: 'Working prototype tested with active target ICP participants.' };
    if (rawScore >= 40) return { level: 4, label: 'IRL 4: Quantitative Problem Validation', desc: 'Evidence from ≥15 customer interviews and validated willingness to pay.' };
    if (rawScore >= 30) return { level: 3, label: 'IRL 3: Competitive Landscape & Moat', desc: 'Defined differentiation thesis against status-quo alternatives.' };
    if (rawScore >= 20) return { level: 2, label: 'IRL 2: Structured Problem-Solution Fit', desc: 'Hypothesized customer pain point articulated and audited.' };
    return { level: 1, label: 'IRL 1: First Principles Concept', desc: 'Raw unvalidated venture hypothesis.' };
  };

  // Calculate VC Committee Grade (S, A, B+, B, C, D)
  const calculateVCGrade = (rawScore: number) => {
    if (rawScore >= 85) return { grade: 'Tier S', badge: 'STRONG ACCELERATE', stage: 'Series A Ready', verdict: 'Unanimous Pass — Exceptional Conviction' };
    if (rawScore >= 75) return { grade: 'Tier A', badge: 'HIGH CONVICTION', stage: 'Seed / Early Growth', verdict: 'Pass — Lead Investor Interest' };
    if (rawScore >= 65) return { grade: 'Tier B+', badge: 'CONDITIONAL PASS', stage: 'Pre-Seed / Incubator', verdict: 'Conditional — Validate Primary Moat First' };
    if (rawScore >= 50) return { grade: 'Tier B', badge: 'EXPLORATORY', stage: 'Angel / Syndicate', verdict: 'Hold — High Commercial Risk Identified' };
    if (rawScore >= 35) return { grade: 'Tier C', badge: 'PIVOT ADVICE', stage: 'Incubation Lab', verdict: 'Decline — Fatal Market or Moat Flaws' };
    return { grade: 'Tier D', badge: 'DO NOT PURSUE', stage: 'Ideation Only', verdict: 'Reject — Lethal Structural Disadvantages' };
  };

  const irl = calculateIRL(score);
  const vc = calculateVCGrade(score);

  // Calculate Simulated Score based on custom weights
  const totalWeight = weights.problemUrgency + weights.marketViability + weights.defensibilityMoat + weights.executionRisk || 100;
  const simulatedScore = Math.round(
    (dimensions.problemUrgency * (weights.problemUrgency / totalWeight) +
      dimensions.marketViability * (weights.marketViability / totalWeight) +
      dimensions.defensibilityMoat * (weights.defensibilityMoat / totalWeight) +
      dimensions.executionRisk * (weights.executionRisk / totalWeight)) * 4
  );

  // Confidence Interval Calculation (based on number of verified sources)
  const confidenceMargin = sourcesCount >= 10 ? 4 : sourcesCount >= 5 ? 7 : 12;
  const lowerBound = Math.max(0, score - confidenceMargin);
  const upperBound = Math.min(100, score + confidenceMargin);

  const resetWeights = () => {
    setWeights({
      problemUrgency: 25,
      marketViability: 25,
      defensibilityMoat: 25,
      executionRisk: 25
    });
  };

  return (
    <div id="multi-scale-scoring-widget" className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header & Scale Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Readiness Scoring Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Multi-Perspective Framework</span>
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Venture Readiness & Multi-Scale Evaluation
          </h2>
        </div>

        {/* Scale Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveScale('STANDARD')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeScale === 'STANDARD'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            100-Pt Index
          </button>
          <button
            onClick={() => setActiveScale('IRL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeScale === 'IRL'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            IRL 1–9
          </button>
          <button
            onClick={() => setActiveScale('VC_GRADE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeScale === 'VC_GRADE'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            VC Grade
          </button>
          <button
            onClick={() => setActiveScale('RAG_CONFIDENCE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeScale === 'RAG_CONFIDENCE'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            RAG / ± Band
          </button>
          <button
            onClick={() => setActiveScale('SIMULATOR')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeScale === 'SIMULATOR'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: STANDARD 100-POINT INDEX */}
      {activeScale === 'STANDARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
          {/* Main Score Hero */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-mono">
              <span>OVERALL READINESS INDEX</span>
              <ShieldCheck className="w-4 h-4 text-red-500" />
            </div>

            <div className="py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {score}
                </span>
                <span className="text-xl font-mono text-slate-400">/ 100</span>
              </div>
              <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400 mt-2">
                {tier}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0-49 Kill/Pivot</span>
                <span>50-74 Validate</span>
                <span>75-100 Build</span>
              </div>
            </div>
          </div>

          {/* 4 Dimension Summary Bars */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Quadrant Score Breakdown (25 Pts Each)
              </span>
              <span className="text-[11px] font-mono text-slate-400">Sum = {score} pts</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>1. Market Problem Urgency</span>
                  <span className="text-red-600 dark:text-red-400">{dimensions.problemUrgency} / 25</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(dimensions.problemUrgency / 25) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>2. Business Model Viability & Economics</span>
                  <span className="text-red-600 dark:text-red-400">{dimensions.marketViability} / 25</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(dimensions.marketViability / 25) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>3. Defensibility Moat & Pricing Power</span>
                  <span className="text-red-600 dark:text-red-400">{dimensions.defensibilityMoat} / 25</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(dimensions.defensibilityMoat / 25) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>4. Execution & Adversarial De-risking</span>
                  <span className="text-red-600 dark:text-red-400">{dimensions.executionRisk} / 25</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(dimensions.executionRisk / 25) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: IRL SCALE (1 to 9) */}
      {activeScale === 'IRL' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-500">
                Investment Readiness Level (IRL 1–9)
              </div>
              <div className="text-2xl font-black font-mono text-red-600 dark:text-red-400">
                {irl.label}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {irl.desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shrink-0">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Current Stage</span>
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">IRL {irl.level}</span>
              <span className="text-[10px] font-mono text-slate-400 block">/ 9 Levels</span>
            </div>
          </div>

          {/* Stepped Progress Pipeline for IRL */}
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
              const isPassed = lvl <= irl.level;
              const isCurrent = lvl === irl.level;
              return (
                <div
                  key={lvl}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isCurrent
                      ? 'bg-red-600 text-white border-red-700 shadow-xs font-bold'
                      : isPassed
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="text-xs font-mono font-bold">L{lvl}</div>
                  <div className="text-[9px] font-mono mt-0.5 truncate">
                    {lvl === 1 ? 'Concept' : lvl === 4 ? 'Interviews' : lvl === 6 ? 'Pilot' : lvl === 9 ? 'Scale' : `Step ${lvl}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: VC INVESTMENT COMMITTEE GRADE */}
      {activeScale === 'VC_GRADE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-500">
              VC COMMITTEE RATING
            </div>
            <div className="py-3">
              <span className="text-4xl font-black font-mono text-red-600 dark:text-red-400">
                {vc.grade}
              </span>
              <div className="mt-1 text-xs font-mono font-bold text-slate-900 dark:text-white">
                {vc.badge}
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-2">
              Stage Fit: <strong className="text-slate-700 dark:text-slate-300">{vc.stage}</strong>
            </div>
          </div>

          <div className="md:col-span-2 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
              <span>COMMITTEE CONSENSUS & ALLOCATION SIGNAL</span>
              <Award className="w-4 h-4 text-red-500" />
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed">
              <span className="text-red-500 font-bold">Investment Verdict:</span> {vc.verdict}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] block">Capital Efficiency</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {dimensions.marketViability >= 18 ? 'High (>70% GM)' : 'Moderate (Requires Seed)'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] block">Downside Protection</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {dimensions.executionRisk >= 16 ? 'Strong (>65%)' : 'Fragile / Unmitigated'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: RAG STATUS & CONFIDENCE INTERVAL */}
      {activeScale === 'RAG_CONFIDENCE' && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">
                Statistical Confidence & Uncertainty Range
              </div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                Score: {score} ± {confidenceMargin} pts ({lowerBound} – {upperBound})
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                score >= 70
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : score >= 50
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
              }`}>
                {score >= 70 ? '🟢 GREEN (PROCEED)' : score >= 50 ? '🟡 AMBER (VALIDATE)' : '🔴 RED (KILL / PIVOT)'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative h-6 bg-slate-200 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800">
              {/* Confidence Band */}
              <div
                className="absolute h-full bg-red-500/20 border-x border-red-500/50"
                style={{
                  left: `${lowerBound}%`,
                  width: `${upperBound - lowerBound}%`
                }}
              />
              {/* Point Estimate */}
              <div
                className="absolute h-full w-1.5 bg-red-600 shadow-md"
                style={{ left: `${score}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>0 (Fatal)</span>
              <span>Lower: {lowerBound}</span>
              <span className="font-bold text-red-600 dark:text-red-400">Mean: {score}</span>
              <span>Upper: {upperBound}</span>
              <span>100 (Peak)</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            *Confidence interval derived from {sourcesCount} verified citations and empirical cross-agent agreement level ({confidence}).
          </p>
        </div>
      )}

      {/* VIEW 5: INTERACTIVE SENSITIVITY SIMULATOR */}
      {activeScale === 'SIMULATOR' && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 uppercase">
                Interactive Dimension Weight Simulator
              </span>
              <p className="text-[11px] text-slate-500">
                Adjust criteria weighting to test investor-specific or founder-specific risk tolerance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">Simulated Score</span>
                <span className="text-xl font-black text-red-600 dark:text-red-400">{simulatedScore}/100</span>
              </div>
              <button
                onClick={resetWeights}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:text-red-600 transition-colors"
                title="Reset to equal 25% weights"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Problem Urgency Weight:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{weights.problemUrgency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={weights.problemUrgency}
                onChange={(e) => setWeights({ ...weights, problemUrgency: Number(e.target.value) })}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Unit Economics Weight:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{weights.marketViability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={weights.marketViability}
                onChange={(e) => setWeights({ ...weights, marketViability: Number(e.target.value) })}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Defensibility Moat Weight:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{weights.defensibilityMoat}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={weights.defensibilityMoat}
                onChange={(e) => setWeights({ ...weights, defensibilityMoat: Number(e.target.value) })}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Execution Risk Weight:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{weights.executionRisk}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={weights.executionRisk}
                onChange={(e) => setWeights({ ...weights, executionRisk: Number(e.target.value) })}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
