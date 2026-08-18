import React from 'react';
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
  Compass
} from 'lucide-react';

export const AnalysisProgressView: React.FC = () => {
  const { activeVenture, analysisState, isAnalyzing, error, runAnalysis, setActiveView } = useVenture();
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  if (!activeVenture) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
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

  const agents = [
    {
      id: 'researcher',
      name: t.agents.researcher.name,
      role: t.agents.researcher.role,
      icon: Search,
      status: researchStatus,
      activityRunning: 'Reviewing market evidence, sources & benchmarks...',
      activityWaiting: 'Waiting for pipeline initialization',
      activityCompleted: `${researchReport?.findings?.length || 0} findings • ${researchReport?.sources?.length || 0} sources`,
      view: 'report_research' as const
    },
    {
      id: 'business',
      name: t.agents.business.name,
      role: t.agents.business.role,
      icon: TrendingUp,
      status: businessStatus,
      activityRunning: 'Auditing unit economics, pricing & defensibility...',
      activityWaiting: 'Waiting for research evidence synthesis',
      activityCompleted: `${businessReport?.businessAssumptions?.length || businessReport?.assumptions?.length || 0} critical assumptions audited`,
      view: 'report_business' as const
    },
    {
      id: 'redTeam',
      name: t.agents.redTeam.name,
      role: t.agents.redTeam.role,
      icon: ShieldAlert,
      status: redTeamStatus,
      activityRunning: 'Stress testing assumptions & surfacing kill vectors...',
      activityWaiting: 'Waiting for business model dossier',
      activityCompleted: `${redTeamReport?.criticalRisks?.length || 0} critical risks & kill vectors mapped`,
      view: 'report_red_team' as const
    },
    {
      id: 'judge',
      name: t.agents.judge.name,
      role: t.agents.judge.role,
      icon: Scale,
      status: judgeStatus,
      activityRunning: 'Arbitrating agent findings & computing score...',
      activityWaiting: 'Waiting for adversarial audit completion',
      activityCompleted: `Verdict: ${activeVenture.score?.recommendationTier || 'EVALUATED'} (${activeVenture.score?.totalScore || 0}/100)`,
      view: 'report_judge' as const
    }
  ];

  return (
    <div id="view-analysis-progress" className="max-w-4xl mx-auto py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                {t.navigation.flowIntelligence}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {isComplete ? t.common.completed : t.common.inProgress}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeVenture.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isComplete ? t.pipeline.pipelineComplete : t.pipeline.runningPipeline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isAnalyzing && (
              <button
                onClick={() => runAnalysis(activeVenture.id)}
                className="px-3 py-2 rounded-lg text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rerun Analysis</span>
              </button>
            )}
            {isComplete && (
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t.pipeline.viewDecisionCockpit}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Agent Sequential Cards */}
      <div className="space-y-3.5">
        {agents.map((agent, idx) => {
          const Icon = agent.icon;
          const isRunning = agent.status === 'running';
          const isDone = agent.status === 'completed';
          const isWaiting = agent.status === 'waiting';

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl border transition-all ${
                isRunning
                  ? 'bg-red-500/5 border-red-500/40 shadow-xs'
                  : isDone
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                      isRunning
                        ? 'bg-red-500/20 border-red-500/40 text-red-500 animate-pulse'
                        : isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                        0{idx + 1}.
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {agent.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        — {agent.role}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {isRunning ? (
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-mono">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {agent.activityRunning}
                        </span>
                      ) : isDone ? (
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          ✓ {agent.activityCompleted}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400">
                          {agent.activityWaiting}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isDone && (
                    <button
                      onClick={() => setActiveView(agent.view)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border border-slate-200 dark:border-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Dossier →
                    </button>
                  )}
                  {isRunning && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
