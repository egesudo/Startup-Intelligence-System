import React from 'react';
import { useVenture, ActiveView } from '../../context/VentureContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Lightbulb,
  Cpu,
  Target,
  Search,
  TrendingUp,
  ShieldAlert,
  Scale,
  Plus,
  FolderOpen,
  ChevronRight,
  Compass
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { ventures, activeVenture, activeView, setActiveView, selectVenture } = useVenture();
  const { t } = useLanguage();

  const coreNav: Array<{
    view: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
    badge?: string;
  }> = [
    {
      view: 'input',
      label: t.navigation.ideaInput,
      icon: Lightbulb
    },
    {
      view: 'analysis',
      label: t.navigation.agentPipeline,
      icon: Cpu,
      disabled: !activeVenture
    },
    {
      view: 'dashboard',
      label: t.navigation.decisionCockpit,
      icon: Compass,
      disabled: !activeVenture?.score,
      badge: activeVenture?.score ? `${activeVenture.score.totalScore}/100` : undefined
    }
  ];

  const reportNav: Array<{
    view: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
  }> = [
    {
      view: 'report_research',
      label: t.navigation.researchEvidence,
      icon: Search,
      disabled: !activeVenture?.researchReport
    },
    {
      view: 'report_business',
      label: t.navigation.businessEconomics,
      icon: TrendingUp,
      disabled: !activeVenture?.businessReport
    },
    {
      view: 'report_red_team',
      label: t.navigation.redTeamRisks,
      icon: ShieldAlert,
      disabled: !activeVenture?.redTeamReport
    },
    {
      view: 'report_judge',
      label: t.navigation.judgeSynthesis,
      icon: Scale,
      disabled: !activeVenture?.judgeReport
    }
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex flex-col justify-between h-[calc(100vh-3.5rem)] select-none shrink-0 transition-colors duration-200"
    >
      {/* Navigation Sections */}
      <div className="p-3.5 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {/* Core Intelligence Flow */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 font-mono">
            {t.navigation.intelligenceFlow}
          </div>
          <nav className="space-y-1">
            {coreNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;
              const isDisabled = item.disabled;

              return (
                <button
                  key={item.view}
                  id={`nav-item-${item.view}`}
                  disabled={isDisabled}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 shadow-xs border border-red-500/30 font-bold'
                      : isDisabled
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-red-600 dark:text-red-400'
                          : isDisabled
                          ? 'text-slate-400 dark:text-slate-600'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      {item.badge}
                    </span>
                  )}
                  {isDisabled && (
                    <span className="text-[9px] uppercase font-semibold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                      Locked
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Specialized Dossiers */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 font-mono">
            {t.navigation.specializedDossiers}
          </div>
          <nav className="space-y-1">
            {reportNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;
              const isDisabled = item.disabled;

              return (
                <button
                  key={item.view}
                  id={`nav-item-${item.view}`}
                  disabled={isDisabled}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 shadow-xs border border-red-500/30 font-bold'
                      : isDisabled
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-red-600 dark:text-red-400'
                          : isDisabled
                          ? 'text-slate-400 dark:text-slate-600'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isDisabled && (
                    <span className="text-[9px] uppercase font-semibold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Telemetry Workspace */}
        {activeVenture && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 font-mono">
              Intelligence System
            </div>
            <button
              id="nav-item-workspace"
              onClick={() => setActiveView('workspace')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'workspace'
                  ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 shadow-xs border border-red-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Target className="w-4 h-4 text-red-500" />
                <span>{t.navigation.agentWorkspace}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Venture Switcher Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            {t.navigation.allVentures} ({ventures.length})
          </span>
          <button
            id="btn-sidebar-add-venture"
            onClick={() => setActiveView('input')}
            className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Create New Venture"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 pr-1">
          {ventures.length === 0 ? (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 italic px-2 py-1">
              {t.navigation.noVenturesFound}
            </div>
          ) : (
            ventures.map((v) => {
              const isSelected = activeVenture?.id === v.id;
              return (
                <button
                  key={v.id}
                  id={`venture-list-item-${v.id}`}
                  onClick={() => selectVenture(v.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 font-bold border border-red-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-red-500' : 'text-slate-400'}`} />
                    <span className="truncate">{v.title}</span>
                  </div>
                  {v.score && (
                    <span className="text-[10px] font-mono shrink-0 ml-1 opacity-80">
                      {v.score.totalScore}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
