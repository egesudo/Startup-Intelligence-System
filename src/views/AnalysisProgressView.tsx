import React, { useState, useEffect } from 'react';
import { useVenture } from '../context/VentureContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  TrendingUp,
  ShieldAlert,
  Scale,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Compass,
  Activity,
  Check,
  ChevronRight,
  Database,
  Layers,
  FileText
} from 'lucide-react';

export const AnalysisProgressView: React.FC = () => {
  const { activeVenture, analysisState, isAnalyzing, error, runAnalysis, setActiveView, isLoadedFromCache } = useVenture();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isTr = language === 'tr';

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live timer while analysis is running
  useEffect(() => {
    let interval: any = null;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing]);

  if (!activeVenture) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs">
        {t.common.noVentureActive}
      </div>
    );
  }

  const workflow = analysisState?.agentWorkflow;
  const isComplete = activeVenture.status === 'evaluated' || activeVenture.status === 'decided';

  // Agent 1: Researcher
  const researchReport = activeVenture.researchReport;
  let researchStatus: 'waiting' | 'running' | 'completed' | 'failed' = 'waiting';
  if (researchReport) {
    researchStatus = 'completed';
  } else if (workflow?.research?.status === 'running' || (isAnalyzing && !researchReport)) {
    researchStatus = 'running';
  } else if (workflow?.research?.status === 'failed') {
    researchStatus = 'failed';
  }

  // Agent 2: Business
  const businessReport = activeVenture.businessReport;
  let businessStatus: 'waiting' | 'running' | 'completed' | 'failed' = 'waiting';
  if (businessReport) {
    businessStatus = 'completed';
  } else if (workflow?.business?.status === 'running' || (isAnalyzing && researchReport && !businessReport)) {
    businessStatus = 'running';
  } else if (workflow?.business?.status === 'failed') {
    businessStatus = 'failed';
  }

  // Agent 3: Red Team
  const redTeamReport = activeVenture.redTeamReport;
  let redTeamStatus: 'waiting' | 'running' | 'completed' | 'failed' = 'waiting';
  if (redTeamReport) {
    redTeamStatus = 'completed';
  } else if (workflow?.redTeam?.status === 'running' || (isAnalyzing && businessReport && !redTeamReport)) {
    redTeamStatus = 'running';
  } else if (workflow?.redTeam?.status === 'failed') {
    redTeamStatus = 'failed';
  }

  // Agent 4: Judge
  const judgeReport = activeVenture.judgeReport;
  let judgeStatus: 'waiting' | 'running' | 'completed' | 'failed' = 'waiting';
  if (judgeReport) {
    judgeStatus = 'completed';
  } else if (workflow?.judge?.status === 'running' || (isAnalyzing && redTeamReport && !judgeReport)) {
    judgeStatus = 'running';
  } else if (workflow?.judge?.status === 'failed') {
    judgeStatus = 'failed';
  }

  // Calculate master progress percentage
  const completedAgentsCount = [researchStatus, businessStatus, redTeamStatus, judgeStatus].filter(s => s === 'completed').length;
  let overallPercentage = completedAgentsCount * 25;
  if (isAnalyzing && overallPercentage < 100) {
    // Add micro-progress for current running agent
    overallPercentage += 12;
  }
  if (isComplete) {
    overallPercentage = 100;
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const agents = [
    {
      id: 'researcher',
      stepNum: '01',
      name: t.agents.researcher.name,
      role: t.agents.researcher.role,
      icon: Search,
      status: researchStatus,
      progressPercent: researchStatus === 'completed' ? 100 : researchStatus === 'running' ? 65 : 0,
      activityRunning: isTr ? 'Pazar kanıtları, kaynaklar ve kıyaslamalar taranıyor...' : 'Reviewing market evidence, sources & benchmarks...',
      activityWaiting: isTr ? 'Boru hattı başlatılması bekleniyor' : 'Waiting for pipeline initialization',
      activityCompleted: isTr 
        ? `${researchReport?.findings?.length || 0} pazar bulgusu • ${researchReport?.sources?.length || 0} doğrulanmış kaynak`
        : `${researchReport?.findings?.length || 0} market findings • ${researchReport?.sources?.length || 0} verified sources`,
      microSteps: isTr ? [
        { label: 'Problem & Hedef Kitle (ICP) Ayrıştırması', done: !!researchReport || researchStatus === 'running' },
        { label: 'Pazar Büyüklüğü (TAM / SAM / SOM) Hesaplaması', done: !!researchReport },
        { label: 'Doğrulanmış Kanıtlar & Rakip Haritalandırması', done: !!researchReport }
      ] : [
        { label: 'Problem & ICP Customer Segmentation', done: !!researchReport || researchStatus === 'running' },
        { label: 'Market Sizing (TAM / SAM / SOM) Analysis', done: !!researchReport },
        { label: 'Empirical Evidence & Competitor Mapping', done: !!researchReport }
      ],
      view: 'report_research' as const
    },
    {
      id: 'business',
      stepNum: '02',
      name: t.agents.business.name,
      role: t.agents.business.role,
      icon: TrendingUp,
      status: businessStatus,
      progressPercent: businessStatus === 'completed' ? 100 : businessStatus === 'running' ? 60 : 0,
      activityRunning: isTr ? 'Birim ekonomi, fiyatlandırma ve rekabet avantajı denetleniyor...' : 'Auditing unit economics, pricing & defensibility...',
      activityWaiting: isTr ? 'Pazar araştırması sentezi bekleniyor' : 'Waiting for research evidence synthesis',
      activityCompleted: isTr
        ? `${businessReport?.businessAssumptions?.length || businessReport?.assumptions?.length || 0} kritik varsayım denetlendi`
        : `${businessReport?.businessAssumptions?.length || businessReport?.assumptions?.length || 0} critical assumptions audited`,
      microSteps: isTr ? [
        { label: 'Gelir Modeli & Fiyatlandırma Kademeleri', done: !!businessReport || businessStatus === 'running' },
        { label: 'Kullanıcı vs. Satın Alıcı Yetki Ayrıştırması', done: !!businessReport },
        { label: 'Birim Ekonomi (CAC / LTV) & Brüt Marj Profili', done: !!businessReport }
      ] : [
        { label: 'Monetization Architecture & Pricing Tiers', done: !!businessReport || businessStatus === 'running' },
        { label: 'User vs. Buyer Persona & Authority Mapping', done: !!businessReport },
        { label: 'Unit Economics (CAC / LTV) & Gross Margin Profile', done: !!businessReport }
      ],
      view: 'report_business' as const
    },
    {
      id: 'redTeam',
      stepNum: '03',
      name: t.agents.redTeam.name,
      role: t.agents.redTeam.role,
      icon: ShieldAlert,
      status: redTeamStatus,
      progressPercent: redTeamStatus === 'completed' ? 100 : redTeamStatus === 'running' ? 70 : 0,
      activityRunning: isTr ? 'Varsayımlar stres testine tabi tutuluyor & ölüm vektörleri haritalanıyor...' : 'Stress testing assumptions & surfacing kill vectors...',
      activityWaiting: isTr ? 'İş modeli dosyasının tamamlanması bekleniyor' : 'Waiting for business model dossier',
      activityCompleted: isTr
        ? `${redTeamReport?.criticalRisks?.length || 0} kritik risk ve ölüm vektörü haritalandı`
        : `${redTeamReport?.criticalRisks?.length || 0} critical risks & kill vectors mapped`,
      microSteps: isTr ? [
        { label: 'Varsayım Kırılganlığı & Tersine Çevirme Testi', done: !!redTeamReport || redTeamStatus === 'running' },
        { label: 'Pazar Lideri Baskısı & Ölüm Vektörleri', done: !!redTeamReport },
        { label: 'Müşteri Geçiş Engelleri & Sürtünme Analizi', done: !!redTeamReport }
      ] : [
        { label: 'Adversarial Assumption Inversion & Fragility Test', done: !!redTeamReport || redTeamStatus === 'running' },
        { label: 'Incumbent Moat Absorption & Direct Kill Vectors', done: !!redTeamReport },
        { label: 'Customer Adoption Barriers & Migration Friction', done: !!redTeamReport }
      ],
      view: 'report_red_team' as const
    },
    {
      id: 'judge',
      stepNum: '04',
      name: t.agents.judge.name,
      role: t.agents.judge.role,
      icon: Scale,
      status: judgeStatus,
      progressPercent: judgeStatus === 'completed' ? 100 : judgeStatus === 'running' ? 85 : 0,
      activityRunning: isTr ? 'Ajan bulguları uzlaştırılıyor ve 4 boyutlu skor hesaplanıyor...' : 'Arbitrating agent findings & computing deterministic score...',
      activityWaiting: isTr ? 'Karşıt denetimin tamamlanması bekleniyor' : 'Waiting for adversarial audit completion',
      activityCompleted: isTr
        ? `Nihai Karar: ${activeVenture.score?.recommendationTier || 'DEĞERLENDİRİLDİ'} (${activeVenture.score?.totalScore || 0}/100)`
        : `Verdict: ${activeVenture.score?.recommendationTier || 'EVALUATED'} (${activeVenture.score?.totalScore || 0}/100)`,
      microSteps: isTr ? [
        { label: 'Ajan Bulguları Arasında Çelişki Uzlaştırması', done: !!judgeReport || judgeStatus === 'running' },
        { label: '100 Üzerinden 4 Boyutlu Deterministik Puanlama', done: !!judgeReport },
        { label: 'Stratejik Yol Haritası & Öncelikli Aksiyonlar', done: !!judgeReport }
      ] : [
        { label: 'Cross-Agent Evidence Arbitration & Tension Resolution', done: !!judgeReport || judgeStatus === 'running' },
        { label: '4-Dimension 100-Point Deterministic Scoring', done: !!judgeReport },
        { label: 'Strategic Recommendation & De-Risking Roadmap', done: !!judgeReport }
      ],
      view: 'report_judge' as const
    }
  ];

  return (
    <div id="view-analysis-progress" className="max-w-4xl mx-auto py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                {t.navigation.flowIntelligence}
              </span>
              
              {isLoadedFromCache && (
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {isTr ? 'Önbellekten Yüklendi' : 'Verified Cache Hit'}
                </span>
              )}

              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                    <span>{isTr ? 'Ajan Boru Hattı Aktif' : 'Multi-Agent Pipeline Active'} ({formatTime(elapsedSeconds)})</span>
                  </>
                ) : isComplete ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.common.completed}</span>
                  </>
                ) : (
                  <span>{t.common.inProgress}</span>
                )}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeVenture.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              {isComplete ? t.pipeline.pipelineComplete : t.pipeline.runningPipeline}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {!isAnalyzing && (
              <button
                id="btn-rerun-analysis"
                onClick={() => runAnalysis(activeVenture.id, true)}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isTr ? 'Yeniden Analiz Et' : 'Rerun Fresh'}</span>
              </button>
            )}

            {isComplete && (
              <button
                id="btn-view-cockpit"
                onClick={() => setActiveView('dashboard')}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t.pipeline.viewDecisionCockpit}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Master Pipeline Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              {isTr ? 'Toplam Boru Hattı İlerlemesi' : 'Master Pipeline Execution'}
            </span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {overallPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-red-600 via-rose-500 to-red-500 animate-pulse'
              }`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>{isTr ? '1. Araştırma' : '1. Research'}</span>
            <span>{isTr ? '2. İş Modeli' : '2. Business'}</span>
            <span>{isTr ? '3. Karşıt Denetim' : '3. Red Team'}</span>
            <span>{isTr ? '4. Yargıç & Skor' : '4. Judge & Verdict'}</span>
          </div>
        </div>
      </div>

      {/* 4 Agent Sequential Cards with Detailed Progress & Sub-tasks */}
      <div className="space-y-4">
        {agents.map((agent, idx) => {
          const Icon = agent.icon;
          const isRunning = agent.status === 'running';
          const isDone = agent.status === 'completed';
          const isWaiting = agent.status === 'waiting';
          const isFailed = agent.status === 'failed';

          return (
            <div
              key={agent.id}
              id={`agent-card-${agent.id}`}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 ${
                isRunning
                  ? 'bg-red-500/5 dark:bg-red-950/20 border-red-500/50 shadow-md ring-1 ring-red-500/20'
                  : isDone
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                  : 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200/70 dark:border-slate-800/70 opacity-75'
              }`}
            >
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5 sm:space-x-4">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isRunning
                          ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse scale-105'
                          : isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                          {agent.stepNum}.
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {agent.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono hidden md:inline">
                          — {agent.role}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {isRunning ? (
                          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-mono font-semibold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {agent.activityRunning}
                          </span>
                        ) : isDone ? (
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {agent.activityCompleted}
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400">
                            {agent.activityWaiting}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Direct CTA */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isDone && (
                      <button
                        onClick={() => setActiveView(agent.view)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isTr ? 'Dosyayı İncele' : 'Dossier'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isRunning && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        {isTr ? 'İşleniyor' : 'Processing'}
                      </span>
                    )}
                    {isWaiting && (
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                        {isTr ? 'Beklemede' : 'Standby'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Individual Agent Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isDone ? (isTr ? 'Ajan Görevi Tamamlandı' : 'Agent Execution Completed') : isRunning ? (isTr ? 'Yürütülüyor...' : 'Executing sub-tasks...') : (isTr ? 'Sırasını Bekliyor' : 'Awaiting upstream pipeline')}
                    </span>
                    <span className={`font-bold ${isDone ? 'text-emerald-500' : isRunning ? 'text-red-500' : 'text-slate-400'}`}>
                      {agent.progressPercent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-emerald-500'
                          : isRunning
                          ? 'bg-gradient-to-r from-red-500 to-rose-400 animate-pulse'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${agent.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Micro-steps Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {agent.microSteps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className={`p-2 rounded-xl text-xs font-mono flex items-center space-x-2 transition-colors ${
                        step.done
                          ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : isRunning
                          ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                          : 'bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                          step.done
                            ? 'bg-emerald-500 text-white'
                            : isRunning
                            ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {step.done ? '✓' : sIdx + 1}
                      </div>
                      <span className="truncate text-[11px]">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

