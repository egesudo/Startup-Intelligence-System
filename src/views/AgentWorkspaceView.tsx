import React, { useState } from 'react';
import { useVenture } from '../context/VentureContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { AgentIdentity } from '../components/visual/AgentIdentity';
import { Search, TrendingUp, ShieldAlert, Scale, CheckCircle, ArrowRight } from 'lucide-react';

export const AgentWorkspaceView: React.FC = () => {
  const { activeVenture, setActiveView } = useVenture();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'RESEARCH' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE'>('RESEARCH');

  if (!activeVenture) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
        {t.common.noVentureActive}
      </div>
    );
  }

  const agents = [
    {
      type: 'RESEARCH' as const,
      name: t.agents.researcher.name,
      icon: Search,
      role: t.agents.researcher.role,
      ready: !!activeVenture.researchReport,
      view: 'report_research' as const,
      data: activeVenture.researchReport
    },
    {
      type: 'BUSINESS' as const,
      name: t.agents.business.name,
      icon: TrendingUp,
      role: t.agents.business.role,
      ready: !!activeVenture.businessReport,
      view: 'report_business' as const,
      data: activeVenture.businessReport
    },
    {
      type: 'RED_TEAM' as const,
      name: t.agents.redTeam.name,
      icon: ShieldAlert,
      role: t.agents.redTeam.role,
      ready: !!activeVenture.redTeamReport,
      view: 'report_red_team' as const,
      data: activeVenture.redTeamReport
    },
    {
      type: 'JUDGE' as const,
      name: t.agents.judge.name,
      icon: Scale,
      role: t.agents.judge.role,
      ready: !!activeVenture.judgeReport,
      view: 'report_judge' as const,
      data: activeVenture.judgeReport
    }
  ];

  const currentAgent = agents.find(a => a.type === selectedTab)!;

  return (
    <div id="view-agent-workspace" className="space-y-6 pb-12 animate-fade-in">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t.navigation.agentWorkspace} & Telemetry
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
          Inspect decoupled agent reasoning channels, raw outputs, and JSON contracts.
        </p>
      </div>

      {/* Agent Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {agents.map((ag) => {
          const Icon = ag.icon;
          const isSelected = selectedTab === ag.type;
          return (
            <button
              key={ag.type}
              id={`tab-agent-${ag.type}`}
              onClick={() => setSelectedTab(ag.type)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                {ag.ready ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                    Idle
                  </span>
                )}
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">{ag.name}</div>
              <div className="text-xs mt-1 text-slate-500 dark:text-slate-400 line-clamp-1">
                {ag.role}
              </div>
            </button>
          );
        })}
      </div>

      {/* Agent Detail / Telemetry Box */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20">
              <currentAgent.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {currentAgent.name} Telemetry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {currentAgent.role}
              </p>
            </div>
          </div>

          {currentAgent.ready && (
            <button
              onClick={() => setActiveView(currentAgent.view)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t.reports.executiveSummary} Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {currentAgent.ready && currentAgent.data ? (
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Structured JSON Payload Output
            </span>
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800">
              {JSON.stringify(currentAgent.data, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400 font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            {t.common.insufficientEvidence} — Agent has not executed for this venture.
          </div>
        )}
      </div>
    </div>
  );
};
