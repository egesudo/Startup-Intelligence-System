import React, { useState, useMemo } from 'react';
import { useVenture, ActiveView } from '../../context/VentureContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from './StatusBadge';
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
  Compass,
  X,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { Venture } from '../../types/domain';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { ventures, activeVenture, activeView, setActiveView, selectVenture } = useVenture();
  const { language, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'evaluated' | 'in_progress'>('all');

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

  // Filtered recent startup ideas
  const filteredVentures = useMemo(() => {
    return ventures.filter((v) => {
      if (filterType === 'evaluated' && v.status !== 'evaluated' && v.status !== 'decided') return false;
      if (filterType === 'in_progress' && (v.status === 'evaluated' || v.status === 'decided')) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        v.title?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.valueProposition?.toLowerCase().includes(q)
      );
    });
  }, [ventures, searchQuery, filterType]);

  const handleSelectVenture = (ventureId: string) => {
    selectVenture(ventureId);
    const target = ventures.find((v) => v.id === ventureId);
    if (target?.status === 'evaluated' || target?.status === 'decided') {
      setActiveView('dashboard');
    } else if (target?.status === 'analyzing') {
      setActiveView('analysis');
    }
    if (onClose) onClose();
  };

  const handleNewVenture = () => {
    setActiveView('input');
    if (onClose) onClose();
  };

  return (
    <aside
      id="app-sidebar"
      className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col justify-between h-full select-none shrink-0 transition-colors duration-200"
    >
      {/* Header for mobile/drawer */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
              {language === 'tr' ? 'Girişim Oturumları' : 'Analysis Sessions'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {ventures.length} {language === 'tr' ? 'toplam oturum' : 'total ideas'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            id="btn-sidebar-new-idea"
            onClick={handleNewVenture}
            className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all shadow-xs cursor-pointer"
            title={t.common.newVenture}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 p-3.5 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {/* Recent Sessions List with Search */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              {language === 'tr' ? 'Son Girişim Fikirleri' : 'Recent Startup Ideas'} ({ventures.length})
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="sidebar-search-ideas"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'tr' ? 'Fikirlerde ara...' : 'Filter sessions...'}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filter tabs */}
          <div className="flex items-center space-x-1 mb-2 px-1 text-[10px] font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'tr' ? 'Tümü' : 'All'}
            </button>
            <button
              onClick={() => setFilterType('evaluated')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filterType === 'evaluated'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'tr' ? 'Tamamlanan' : 'Done'}
            </button>
            <button
              onClick={() => setFilterType('in_progress')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filterType === 'in_progress'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'tr' ? 'Taslak' : 'Draft'}
            </button>
          </div>

          {/* List of Venture Cards */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 pr-1">
            {filteredVentures.length === 0 ? (
              <div className="text-[11px] text-slate-400 dark:text-slate-500 italic px-2 py-3 text-center bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                {t.navigation.noVenturesFound}
              </div>
            ) : (
              filteredVentures.map((v) => {
                const isSelected = activeVenture?.id === v.id;
                return (
                  <button
                    key={v.id}
                    id={`sidebar-session-${v.id}`}
                    onClick={() => handleSelectVenture(v.id)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all flex flex-col space-y-1 border cursor-pointer ${
                      isSelected
                        ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 shadow-xs'
                        : 'border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <span className="font-bold truncate text-xs">
                        {v.title}
                      </span>
                      {v.score ? (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                          {v.score.totalScore}/100
                        </span>
                      ) : (
                        <StatusBadge status={v.status} />
                      )}
                    </div>
                    {v.description && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                        {v.description}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Venture Stages Navigation */}
        {activeVenture && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 font-mono flex items-center justify-between">
              <span>{t.navigation.intelligenceFlow}</span>
              <span className="text-red-500 font-bold truncate max-w-[120px]">{activeVenture.title}</span>
            </div>
            <nav className="space-y-1">
              {coreNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.view;
                const isDisabled = item.disabled;

                return (
                  <button
                    key={item.view}
                    id={`sidebar-nav-${item.view}`}
                    disabled={isDisabled}
                    onClick={() => {
                      setActiveView(item.view);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-bold'
                        : isDisabled
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon
                        className={`w-3.5 h-3.5 ${
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
                      <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Specialized Dossiers Navigation */}
        {activeVenture && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 font-mono">
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
                    id={`sidebar-report-${item.view}`}
                    disabled={isDisabled}
                    onClick={() => {
                      setActiveView(item.view);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-bold'
                        : isDisabled
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive
                            ? 'text-red-600 dark:text-red-400'
                            : isDisabled
                            ? 'text-slate-400 dark:text-slate-600'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span>Startup Intelligence</span>
        <span className="text-emerald-500 font-bold">Multi-Agent v2.4</span>
      </div>
    </aside>
  );
};
