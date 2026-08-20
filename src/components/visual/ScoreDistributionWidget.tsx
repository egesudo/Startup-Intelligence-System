import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';
import { useVenture } from '../../context/VentureContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Venture } from '../../types/domain';
import {
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Target,
  Compass
} from 'lucide-react';

interface ScoreDistributionWidgetProps {
  className?: string;
  onSelectVenture?: (ventureId: string) => void;
}

interface AnalyzedIdea {
  id: string;
  title: string;
  totalScore: number;
  tier: 'BUILD' | 'VALIDATE FIRST' | 'REDESIGN' | 'DO NOT PURSUE';
  problemUrgency: number;
  marketViability: number;
  defensibilityMoat: number;
  executionRisk: number;
  isCurrent: boolean;
  isBenchmark?: boolean;
}

export const ScoreDistributionWidget: React.FC<ScoreDistributionWidgetProps> = ({
  className = '',
  onSelectVenture
}) => {
  const { ventures, activeVenture, cachedAnalyses, selectVenture } = useVenture();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isTr = language === 'tr';
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'distribution' | 'ranking' | 'radar'>('distribution');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string | null>(null);

  // Compile all evaluated ventures from context + cached analyses
  const analyzedIdeas: AnalyzedIdea[] = useMemo(() => {
    const map = new Map<string, AnalyzedIdea>();

    // 1. Process active user ventures in context
    ventures.forEach((v) => {
      if (v.score && typeof v.score.totalScore === 'number') {
        const dim = v.score.dimensions || {};
        const getVal = (d: any) => typeof d === 'number' ? d : d?.score ?? 15;
        
        let tier: 'BUILD' | 'VALIDATE FIRST' | 'REDESIGN' | 'DO NOT PURSUE' = 'VALIDATE FIRST';
        const rawRec = v.judgeReport?.aiRecommendation || v.score.recommendationTier || '';
        if (v.score.totalScore >= 80 || rawRec.includes('BUILD') || rawRec.includes('PROCEED')) {
          tier = 'BUILD';
        } else if (v.score.totalScore < 40 || rawRec.includes('KILL') || rawRec.includes('DO NOT PURSUE')) {
          tier = 'DO NOT PURSUE';
        } else if (v.score.totalScore < 60 || rawRec.includes('PIVOT') || rawRec.includes('REDESIGN')) {
          tier = 'REDESIGN';
        } else {
          tier = 'VALIDATE FIRST';
        }

        map.set(v.id, {
          id: v.id,
          title: v.title || 'Untitled Idea',
          totalScore: Math.round(v.score.totalScore),
          tier,
          problemUrgency: Math.round(getVal(dim.marketProblemUrgency || dim.problemValidation)),
          marketViability: Math.round(getVal(dim.businessModelViability || dim.marketFeasibility)),
          defensibilityMoat: Math.round(getVal(dim.defensibilityMoat || dim.unfairAdvantage)),
          executionRisk: Math.round(getVal(dim.executionRisk)),
          isCurrent: activeVenture ? activeVenture.id === v.id : false,
          isBenchmark: false
        });
      }
    });

    // 2. Supplement with cached analyses if not already in map
    cachedAnalyses.forEach((c) => {
      if (c.score && !map.has(c.ventureId)) {
        const dim = c.score.dimensions || {};
        const getVal = (d: any) => typeof d === 'number' ? d : d?.score ?? 15;
        
        let tier: 'BUILD' | 'VALIDATE FIRST' | 'REDESIGN' | 'DO NOT PURSUE' = 'VALIDATE FIRST';
        if (c.score.totalScore >= 80) tier = 'BUILD';
        else if (c.score.totalScore < 40) tier = 'DO NOT PURSUE';
        else if (c.score.totalScore < 60) tier = 'REDESIGN';
        else tier = 'VALIDATE FIRST';

        map.set(c.ventureId, {
          id: c.ventureId,
          title: c.ventureTitle || 'Cached Idea',
          totalScore: Math.round(c.score.totalScore),
          tier,
          problemUrgency: Math.round(getVal(dim.marketProblemUrgency || dim.problemValidation)),
          marketViability: Math.round(getVal(dim.businessModelViability || dim.marketFeasibility)),
          defensibilityMoat: Math.round(getVal(dim.defensibilityMoat || dim.unfairAdvantage)),
          executionRisk: Math.round(getVal(dim.executionRisk)),
          isCurrent: activeVenture ? activeVenture.id === c.ventureId : false,
          isBenchmark: false
        });
      }
    });

    // 3. If there are fewer than 4 items, include a curated set of realistic cohort benchmark ideas
    // so the distribution curves and comparative rankings are immediately insightful to the founder.
    if (map.size < 4) {
      const benchmarks: AnalyzedIdea[] = [
        {
          id: 'bench-ai-copilot',
          title: isTr ? 'B2B İSG ve Saha Uyumluluk Yapay Zekası' : 'B2B Field Safety Compliance Copilot',
          totalScore: 84,
          tier: 'BUILD',
          problemUrgency: 23,
          marketViability: 21,
          defensibilityMoat: 20,
          executionRisk: 20,
          isCurrent: false,
          isBenchmark: true
        },
        {
          id: 'bench-dev-tool',
          title: isTr ? 'PostgreSQL Gerçek Zamanlı Anomali Tespit Aracı' : 'Autonomous PostgreSQL Performance Tuner',
          totalScore: 76,
          tier: 'VALIDATE FIRST',
          problemUrgency: 20,
          marketViability: 19,
          defensibilityMoat: 18,
          executionRisk: 19,
          isCurrent: false,
          isBenchmark: true
        },
        {
          id: 'bench-marketplace',
          title: isTr ? 'Niş Freelance Tasarımcı Pazaryeri' : 'Specialized Motion Designer Marketplace',
          totalScore: 54,
          tier: 'REDESIGN',
          problemUrgency: 14,
          marketViability: 13,
          defensibilityMoat: 12,
          executionRisk: 15,
          isCurrent: false,
          isBenchmark: true
        },
        {
          id: 'bench-social-app',
          title: isTr ? 'Lokal Sporcu ve Maç Bulma Ağı' : 'Neighborhood Sports Matchmaking App',
          totalScore: 36,
          tier: 'DO NOT PURSUE',
          problemUrgency: 9,
          marketViability: 8,
          defensibilityMoat: 7,
          executionRisk: 12,
          isCurrent: false,
          isBenchmark: true
        },
        {
          id: 'bench-health-saas',
          title: isTr ? 'Klinik Randevu ve No-Show Önleme Yazılımı' : 'Dental Practice Revenue Recovery Suite',
          totalScore: 81,
          tier: 'BUILD',
          problemUrgency: 22,
          marketViability: 20,
          defensibilityMoat: 20,
          executionRisk: 19,
          isCurrent: false,
          isBenchmark: true
        },
        {
          id: 'bench-climate-fin',
          title: isTr ? 'KOBİ Karbon Ayak İzi ve Vergi Raporlama' : 'SME Carbon Compliance Ledger',
          totalScore: 68,
          tier: 'VALIDATE FIRST',
          problemUrgency: 18,
          marketViability: 17,
          defensibilityMoat: 16,
          executionRisk: 17,
          isCurrent: false,
          isBenchmark: true
        }
      ];

      benchmarks.forEach((b) => {
        if (!map.has(b.id)) {
          map.set(b.id, b);
        }
      });
    }

    return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
  }, [ventures, activeVenture, cachedAnalyses, isTr]);

  // Aggregate stats
  const totalCount = analyzedIdeas.length;
  const userCount = analyzedIdeas.filter((i) => !i.isBenchmark).length;
  const avgScore = totalCount > 0
    ? Math.round(analyzedIdeas.reduce((sum, i) => sum + i.totalScore, 0) / totalCount)
    : 0;
  const highestIdea = analyzedIdeas[0];
  const lowestIdea = analyzedIdeas[analyzedIdeas.length - 1];

  const currentIdea = analyzedIdeas.find((i) => i.isCurrent) || (activeVenture && activeVenture.score ? {
    id: activeVenture.id,
    title: activeVenture.title,
    totalScore: Math.round(activeVenture.score.totalScore || 70),
    tier: 'VALIDATE FIRST' as const,
    problemUrgency: 18,
    marketViability: 18,
    defensibilityMoat: 17,
    executionRisk: 17,
    isCurrent: true,
    isBenchmark: false
  } : null);

  // Calculate percentile for current venture
  const currentPercentile = useMemo(() => {
    if (!currentIdea || totalCount <= 1) return null;
    const lowerCount = analyzedIdeas.filter((i) => i.totalScore < currentIdea.totalScore).length;
    return Math.round((lowerCount / (totalCount - 1)) * 100);
  }, [currentIdea, analyzedIdeas, totalCount]);

  // 1. Histogram Data (Binned by Standard Decision Tiers)
  const histogramData = useMemo(() => {
    const buckets = [
      {
        tierKey: 'DO NOT PURSUE',
        range: '0–39',
        label: isTr ? '0–39: Takip Edilmemeli' : '0–39: Do Not Pursue',
        shortLabel: '0–39',
        count: 0,
        percentage: 0,
        ideas: [] as AnalyzedIdea[],
        color: '#ef4444', // Red-500
        darkColor: '#f87171',
        isCurrentBucket: false
      },
      {
        tierKey: 'REDESIGN',
        range: '40–59',
        label: isTr ? '40–59: Yeniden Tasarla / Pivot' : '40–59: Redesign / Pivot',
        shortLabel: '40–59',
        count: 0,
        percentage: 0,
        ideas: [] as AnalyzedIdea[],
        color: '#f97316', // Orange-500
        darkColor: '#fb923c',
        isCurrentBucket: false
      },
      {
        tierKey: 'VALIDATE FIRST',
        range: '60–79',
        label: isTr ? '60–79: Önce Doğrula' : '60–79: Validate First',
        shortLabel: '60–79',
        count: 0,
        percentage: 0,
        ideas: [] as AnalyzedIdea[],
        color: '#3b82f6', // Blue-500
        darkColor: '#60a5fa',
        isCurrentBucket: false
      },
      {
        tierKey: 'BUILD',
        range: '80–100',
        label: isTr ? '80–100: İnşa Et (Yüksek Hazırlık)' : '80–100: Build Confidently',
        shortLabel: '80–100',
        count: 0,
        percentage: 0,
        ideas: [] as AnalyzedIdea[],
        color: '#10b981', // Emerald-500
        darkColor: '#34d399',
        isCurrentBucket: false
      }
    ];

    analyzedIdeas.forEach((idea) => {
      let bIdx = 0;
      if (idea.totalScore >= 80) bIdx = 3;
      else if (idea.totalScore >= 60) bIdx = 2;
      else if (idea.totalScore >= 40) bIdx = 1;
      else bIdx = 0;

      buckets[bIdx].count += 1;
      buckets[bIdx].ideas.push(idea);
      if (idea.isCurrent) {
        buckets[bIdx].isCurrentBucket = true;
      }
    });

    buckets.forEach((b) => {
      b.percentage = totalCount > 0 ? Math.round((b.count / totalCount) * 100) : 0;
    });

    return buckets;
  }, [analyzedIdeas, totalCount, isTr]);

  // 2. Ranking Bar Data (Filtered or Top 10)
  const rankingData = useMemo(() => {
    let filtered = analyzedIdeas;
    if (selectedTierFilter) {
      filtered = filtered.filter((i) => i.tier === selectedTierFilter);
    }
    return filtered.slice(0, 10).map((i) => ({
      id: i.id,
      name: i.title.length > 28 ? i.title.slice(0, 26) + '…' : i.title,
      fullName: i.title,
      score: i.totalScore,
      tier: i.tier,
      isCurrent: i.isCurrent,
      isBenchmark: i.isBenchmark,
      color:
        i.totalScore >= 80
          ? '#10b981'
          : i.totalScore >= 60
          ? '#3b82f6'
          : i.totalScore >= 40
          ? '#f97316'
          : '#ef4444'
    }));
  }, [analyzedIdeas, selectedTierFilter]);

  // 3. Radar Multi-Dimension Comparison Data
  const radarData = useMemo(() => {
    // Averages across all analyzed ventures
    const avgProblem = Math.round(
      analyzedIdeas.reduce((sum, i) => sum + i.problemUrgency, 0) / (totalCount || 1)
    );
    const avgViability = Math.round(
      analyzedIdeas.reduce((sum, i) => sum + i.marketViability, 0) / (totalCount || 1)
    );
    const avgMoat = Math.round(
      analyzedIdeas.reduce((sum, i) => sum + i.defensibilityMoat, 0) / (totalCount || 1)
    );
    const avgRisk = Math.round(
      analyzedIdeas.reduce((sum, i) => sum + i.executionRisk, 0) / (totalCount || 1)
    );

    return [
      {
        dimension: isTr ? 'Problem Aciliyeti' : 'Problem Urgency',
        benchmarkAvg: avgProblem,
        currentVenture: currentIdea ? currentIdea.problemUrgency : avgProblem,
        fullMark: 25
      },
      {
        dimension: isTr ? 'Pazar & Ekonomi' : 'Market Viability',
        benchmarkAvg: avgViability,
        currentVenture: currentIdea ? currentIdea.marketViability : avgViability,
        fullMark: 25
      },
      {
        dimension: isTr ? 'Hendek & Savunma' : 'Defensibility Moat',
        benchmarkAvg: avgMoat,
        currentVenture: currentIdea ? currentIdea.defensibilityMoat : avgMoat,
        fullMark: 25
      },
      {
        dimension: isTr ? 'Uygulama Güvenliği' : 'Execution Safety',
        benchmarkAvg: avgRisk,
        currentVenture: currentIdea ? currentIdea.executionRisk : avgRisk,
        fullMark: 25
      }
    ];
  }, [analyzedIdeas, currentIdea, totalCount, isTr]);

  const handleIdeaClick = (ideaId: string) => {
    if (onSelectVenture) {
      onSelectVenture(ideaId);
    } else if (!ideaId.startsWith('bench-')) {
      selectVenture(ideaId);
    }
  };

  return (
    <div
      id="score-distribution-widget"
      className={`p-6 sm:p-8 rounded-3xl border bg-white/80 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-sm space-y-6 ${className}`}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTROLS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {isTr ? 'Portföy Skor Dağılımı' : 'Portfolio Score Distribution'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {totalCount} {isTr ? 'Değerlendirilen Fikir' : 'Evaluated Ideas'}
              {userCount > 0 && ` (${userCount} ${isTr ? 'kullanıcı' : 'user'} + ${totalCount - userCount} ${isTr ? 'kıyaslama' : 'benchmarks'})`}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {isTr ? 'Girişim Skorları ve Karar Dağılım Matrisi' : 'Startup Score & Decision Distribution'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {isTr
              ? 'Tüm analiz edilmiş fikirlerin 100 puanlık deterministik skor dağılımı, karar dilimleri ve kıyaslama konumlandırması.'
              : 'Statistical score distribution across all evaluated startup ideas mapped to decision readiness tiers.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl self-start lg:self-auto border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'distribution'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isTr ? 'Histogram Dağılımı' : 'Tier Histogram'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ranking'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isTr ? 'Karşılaştırmalı Sıralama' : 'Idea Ranking'}</span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{isTr ? '4-Boyut Radar' : '4D Profile'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. EXECUTIVE SUMMARY METRICS BANNER
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
            {isTr ? 'Ortalama Portföy Skoru' : 'Cohort Average'}
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {avgScore} <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {isTr ? '4 boyutun ortalaması' : 'Weighted across 4 dimensions'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
            {isTr ? 'En Yüksek Skor' : 'Top Performing Idea'}
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {highestIdea ? highestIdea.totalScore : 0} <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={highestIdea?.title}>
            {highestIdea?.title || '-'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
            {isTr ? 'Doğrulama Eşiği Geçişi' : 'Viability Pass Rate'}
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
            {totalCount > 0 ? Math.round((analyzedIdeas.filter((i) => i.totalScore >= 60).length / totalCount) * 100) : 0}%
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {isTr ? '≥60 puan (Validate / Build)' : 'Score ≥ 60 (Validate or Build)'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-red-600 dark:text-red-400">
            {isTr ? 'Mevcut Girişim Konumu' : 'Active Venture Position'}
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-red-600 dark:text-red-400">
            {currentIdea ? currentIdea.totalScore : '-'}{' '}
            <span className="text-xs font-bold text-red-500/80">/ 100</span>
          </div>
          <p className="text-[10px] text-slate-600 dark:text-slate-400">
            {currentPercentile !== null
              ? `${isTr ? 'Kohortun en iyi %' : 'Top '}${100 - currentPercentile}% ${isTr ? 'diliminde' : 'percentile'}`
              : isTr ? 'Aktif analiz' : 'Active review'}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN RECHARTS CANVAS AREA
          ───────────────────────────────────────────────────────────── */}
      <div className="min-h-[300px]">
        {/* TAB 1: HISTOGRAM SCORE TIER DISTRIBUTION */}
        {activeTab === 'distribution' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono">
                {isTr ? 'Skor Aralıkları ve Karar Tiers (0-100 Puan)' : 'Score Bins & Decision Tiers (0-100 Pts)'}
              </span>
              <span className="font-mono text-[11px]">
                {isTr ? 'Kırmızı çizgi mevcut girişiminizi temsil eder' : 'Highlighted bar contains active venture'}
              </span>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                  <XAxis
                    dataKey="range"
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                  />
                  <YAxis
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    fontFamily="monospace"
                    allowDecimals={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 rounded-2xl bg-slate-900 text-white text-xs border border-slate-700 shadow-xl font-mono space-y-2 max-w-xs">
                            <div className="font-bold flex items-center justify-between border-b border-slate-700 pb-1.5">
                              <span style={{ color: data.color }}>{data.label}</span>
                              <span className="text-slate-300">
                                {data.count} {isTr ? 'Fikir' : 'Ideas'} ({data.percentage}%)
                              </span>
                            </div>
                            {data.isCurrentBucket && (
                              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {isTr ? 'Mevcut girişiminiz bu dilimde!' : 'Your active venture is in this tier!'}
                              </div>
                            )}
                            <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
                              {data.ideas.map((idea: AnalyzedIdea, idx: number) => (
                                <div
                                  key={idx}
                                  className={`text-[10px] flex items-center justify-between gap-2 p-1 rounded ${
                                    idea.isCurrent
                                      ? 'bg-red-500/20 text-red-300 font-bold'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  <span className="truncate">{idea.title}</span>
                                  <span className="shrink-0 font-bold">{idea.totalScore} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  >
                    {histogramData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={entry.isCurrentBucket ? '#ffffff' : 'transparent'}
                        strokeWidth={entry.isCurrentBucket ? 2 : 0}
                        opacity={entry.isCurrentBucket ? 1 : 0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Visual Tier Legend Pill Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {histogramData.map((bucket, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all text-xs font-mono flex flex-col justify-between ${
                    bucket.isCurrentBucket
                      ? 'bg-slate-100 dark:bg-slate-800 border-red-500/60 shadow-xs ring-1 ring-red-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5" style={{ color: bucket.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bucket.color }} />
                      {bucket.tierKey}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">{bucket.count}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{bucket.range} pts</span>
                    <span>{bucket.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: COMPARATIVE IDEA RANKING */}
        {activeTab === 'ranking' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filter Buttons */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {isTr ? 'Fikirlere göre sıralama (Seçmek için çubuğa tıklayın)' : 'Sorted by Composite Score (Click bar to inspect idea)'}
              </span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={() => setSelectedTierFilter(null)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTierFilter === null
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isTr ? 'Tümü' : 'All'} ({analyzedIdeas.length})
                </button>
                {['BUILD', 'VALIDATE FIRST', 'REDESIGN', 'DO NOT PURSUE'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTierFilter(selectedTierFilter === t ? null : t)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      selectedTierFilter === t
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rankingData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      const clickedId = state.activePayload[0].payload.id;
                      handleIdeaClick(clickedId);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    fontFamily="monospace"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    fontFamily="monospace"
                    width={150}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-2xl bg-slate-900 text-white text-xs border border-slate-700 shadow-xl font-mono space-y-1.5">
                            <div className="font-bold text-slate-100">{d.fullName}</div>
                            <div className="flex items-center justify-between gap-4 text-[11px] border-t border-slate-800 pt-1">
                              <span style={{ color: d.color }}>Tier: {d.tier}</span>
                              <span className="font-bold">{d.score} / 100</span>
                            </div>
                            {d.isCurrent && (
                              <div className="text-[10px] text-red-400 font-bold">
                                ★ {isTr ? 'Şu An Görüntülenen Girişim' : 'Currently Active Venture'}
                              </div>
                            )}
                            {d.isBenchmark && (
                              <div className="text-[10px] text-slate-400">
                                ℹ {isTr ? 'Kohort Kıyaslama Örneği' : 'Benchmark Reference Idea'}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={60} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Validate ≥60', fill: '#3b82f6', fontSize: 10, position: 'top' }} />
                  <ReferenceLine x={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Build ≥80', fill: '#10b981', fontSize: 10, position: 'top' }} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} animationDuration={600} cursor="pointer">
                    {rankingData.map((entry, index) => (
                      <Cell
                        key={`cell-rank-${index}`}
                        fill={entry.color}
                        stroke={entry.isCurrent ? '#ffffff' : 'transparent'}
                        strokeWidth={entry.isCurrent ? 2 : 0}
                        opacity={entry.isCurrent ? 1 : 0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: RADAR 4-DIMENSION BREAKDOWN */}
        {activeTab === 'radar' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono">
                {isTr
                  ? '4 Temel Değerlendirme Boyutunun Kohort Ortalaması ile Kıyaslanması (Her biri max 25 Puan)'
                  : '4-Dimension Readiness vs. Benchmark Cohort Average (25 Pts Max Each)'}
              </span>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <PolarAngleAxis
                    dataKey="dimension"
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    fontFamily="monospace"
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 25]}
                    stroke={isDark ? '#475569' : '#cbd5e1'}
                    fontSize={10}
                    fontFamily="monospace"
                  />
                  <Radar
                    name={isTr ? 'Kohort Ortalaması' : 'Cohort Average'}
                    dataKey="benchmarkAvg"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name={isTr ? 'Mevcut Girişim' : 'Active Venture'}
                    dataKey="currentVenture"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.45}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-2xl bg-slate-900 text-white text-xs border border-slate-700 shadow-xl font-mono space-y-1.5">
                            <div className="font-bold text-slate-100">{d.dimension}</div>
                            <div className="text-[11px] text-red-400 font-bold">
                              {isTr ? 'Mevcut Girişim:' : 'Active Venture:'} {d.currentVenture} / 25
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isTr ? 'Kohort Ortalaması:' : 'Cohort Average:'} {d.benchmarkAvg} / 25
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. FOOTER CLARIFICATION & INTERACTION HINT
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-red-500 shrink-0" />
          <span>
            {isTr
              ? '4x25 = 100 puanlık deterministik matematiksel model ile hesaplanmıştır.'
              : 'Computed via 4x25 = 100 pt deterministic mathematical scoring engine.'}
          </span>
        </div>
        <span className="text-[11px]">
          {isTr ? 'Eşik Değerleri: 80+ İnşa Et • 60-79 Doğrula • <60 Pivot/Ret' : 'Thresholds: 80+ Build • 60-79 Validate • <60 Pivot/Pass'}
        </span>
      </div>
    </div>
  );
};
