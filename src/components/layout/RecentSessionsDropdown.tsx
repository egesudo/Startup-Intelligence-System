import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useVenture, ActiveView } from '../../context/VentureContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from './StatusBadge';
import { 
  ChevronDown, 
  Search, 
  Plus, 
  Check, 
  FolderOpen, 
  Clock, 
  Scale, 
  Compass, 
  Cpu, 
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Venture } from '../../types/domain';

interface RecentSessionsDropdownProps {
  onOpenSidebar?: () => void;
}

export const RecentSessionsDropdown: React.FC<RecentSessionsDropdownProps> = ({ onOpenSidebar }) => {
  const { ventures, activeVenture, selectVenture, setActiveView } = useVenture();
  const { language, t } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'evaluated' | 'in_progress'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      // Auto focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Format relative timestamp
  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 2) return language === 'tr' ? 'Az önce' : 'Just now';
      if (diffMins < 60) return language === 'tr' ? `${diffMins} dk önce` : `${diffMins}m ago`;
      if (diffHours < 24) return language === 'tr' ? `${diffHours} sa önce` : `${diffHours}h ago`;
      if (diffDays === 1) return language === 'tr' ? 'Dün' : 'Yesterday';
      if (diffDays < 7) return language === 'tr' ? `${diffDays} gün önce` : `${diffDays}d ago`;
      return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Filter and sort ventures
  const filteredVentures = useMemo(() => {
    return ventures.filter((v) => {
      // Filter by type
      if (filterType === 'evaluated' && v.status !== 'evaluated' && v.status !== 'decided') {
        return false;
      }
      if (filterType === 'in_progress' && (v.status === 'evaluated' || v.status === 'decided')) {
        return false;
      }

      // Filter by query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = v.title?.toLowerCase().includes(q);
      const descMatch = v.description?.toLowerCase().includes(q);
      const targetMatch = v.targetAudience?.toLowerCase().includes(q);
      const valPropMatch = v.valueProposition?.toLowerCase().includes(q);
      return titleMatch || descMatch || targetMatch || valPropMatch;
    });
  }, [ventures, searchQuery, filterType]);

  const handleSelectSession = (ventureId: string, preferredView?: ActiveView) => {
    selectVenture(ventureId);
    if (preferredView) {
      setActiveView(preferredView);
    } else {
      // Default view based on venture status
      const target = ventures.find(v => v.id === ventureId);
      if (target?.status === 'evaluated' || target?.status === 'decided') {
        setActiveView('dashboard');
      } else if (target?.status === 'analyzing') {
        setActiveView('analysis');
      } else {
        setActiveView('dashboard');
      }
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleNewVentureClick = () => {
    setActiveView('input');
    setIsOpen(false);
  };

  // Recommendation pill badge for items in list
  const getRecommendationPill = (v: Venture) => {
    const rec = v.judgeReport?.aiRecommendation || (v.score ? (v.score.totalScore >= 75 ? 'BUILD' : v.score.totalScore >= 50 ? 'VALIDATE FIRST' : 'DO NOT PURSUE') : null);
    if (!rec) return null;

    let colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    if (rec === 'BUILD' || rec === 'PROCEED_CONFIDENTLY') {
      colorClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    } else if (rec === 'VALIDATE FIRST' || rec === 'PROCEED_WITH_VALIDATION') {
      colorClass = 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30';
    } else if (rec === 'REDESIGN' || rec === 'PIVOT_REQUIRED') {
      colorClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    } else if (rec === 'DO NOT PURSUE' || rec === 'KILL_RECOMMENDED') {
      colorClass = 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30';
    }

    return (
      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${colorClass}`}>
        {rec}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        id="btn-recent-sessions-dropdown"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-100 dark:bg-slate-900 border-red-500/50 ring-2 ring-red-500/20 shadow-xs'
            : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900'
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0 max-w-[180px] sm:max-w-[240px] md:max-w-[300px]">
          <Layers className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <div className="text-left truncate">
            {activeVenture ? (
              <div className="flex items-center space-x-1.5 truncate">
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {activeVenture.title}
                </span>
                {activeVenture.score && (
                  <span className="hidden sm:inline-flex text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                    {activeVenture.score.totalScore}/100
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {language === 'tr' ? 'Oturum Seçin...' : 'Select Session...'}
              </span>
            )}
          </div>
        </div>

        {/* Small badge or counter */}
        <div className="flex items-center space-x-1 shrink-0 pl-1 border-l border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">
            {ventures.length}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-red-500' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          id="recent-sessions-dropdown-menu"
          className="absolute left-0 top-full mt-2 w-[340px] sm:w-[420px] md:w-[460px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[540px] animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header & Search */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {language === 'tr' ? 'Son Girişim Analizleri' : 'Recent Analysis Sessions'}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {ventures.length}
                </span>
              </div>

              {onOpenSidebar && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSidebar();
                  }}
                  className="text-[11px] text-slate-500 hover:text-red-500 dark:text-slate-400 flex items-center space-x-1 font-mono transition-colors cursor-pointer"
                  title="Open full sidebar"
                >
                  <span>{language === 'tr' ? 'Yan Panel' : 'Full Sidebar'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="search-recent-sessions"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'tr' ? 'Girişim fikri veya pazar ara...' : 'Search startup ideas, problems, markets...'}
                className="w-full pl-8.5 pr-8 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center space-x-1.5 pt-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'tr' ? 'Tümü' : 'All'} ({ventures.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('evaluated')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterType === 'evaluated'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'tr' ? 'Tamamlanan' : 'Evaluated'} (
                {ventures.filter(v => v.status === 'evaluated' || v.status === 'decided').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('in_progress')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterType === 'in_progress'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'tr' ? 'Devam Eden' : 'In Progress'} (
                {ventures.filter(v => v.status !== 'evaluated' && v.status !== 'decided').length})
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
            {filteredVentures.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? language === 'tr'
                      ? `"${searchQuery}" ile eşleşen girişim bulunamadı.`
                      : `No sessions matched "${searchQuery}".`
                    : language === 'tr'
                    ? 'Henüz analiz edilmiş girişim bulunmuyor.'
                    : 'No analysis sessions found.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-red-500 hover:underline font-mono"
                  >
                    {language === 'tr' ? 'Filtreyi Temizle' : 'Clear search'}
                  </button>
                )}
              </div>
            ) : (
              filteredVentures.map((v) => {
                const isActive = activeVenture?.id === v.id;
                const isEvaluated = v.status === 'evaluated' || v.status === 'decided';

                return (
                  <div
                    key={v.id}
                    id={`session-item-${v.id}`}
                    onClick={() => handleSelectSession(v.id)}
                    className={`pt-1.5 first:pt-0 group relative rounded-xl p-2.5 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-red-500/5 dark:bg-red-500/10 border-red-500/40 shadow-xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Left info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          )}
                          <span
                            className={`font-bold text-xs truncate ${
                              isActive
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400'
                            }`}
                          >
                            {v.title}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-mono uppercase font-black tracking-wider px-1.5 py-0.2 rounded bg-red-500/15 text-red-600 dark:text-red-400 shrink-0">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Snippet / Description */}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {v.description || v.valueProposition || (language === 'tr' ? 'Açıklama belirtilmemiş' : 'No description specified')}
                        </p>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          <StatusBadge status={v.status} />
                          {getRecommendationPill(v)}
                          {v.updatedAt && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{formatTimestamp(v.updatedAt)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right score / quick action */}
                      <div className="shrink-0 flex flex-col items-end space-y-1">
                        {v.score ? (
                          <div className="text-right">
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              {v.score.totalScore}
                              <span className="text-[10px] text-slate-400 font-normal">/100</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">
                            {v.status === 'analyzing' ? (
                              <Cpu className="w-3.5 h-3.5 text-red-500 animate-spin" />
                            ) : (
                              'Draft'
                            )}
                          </span>
                        )}

                        {/* Quick Jump Buttons on Hover */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEvaluated && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSession(v.id, 'report_judge');
                              }}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                              title={language === 'tr' ? 'Hakem Raporunu Aç' : 'View Judge Synthesis'}
                            >
                              <Scale className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSession(v.id, isEvaluated ? 'dashboard' : 'analysis');
                            }}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                            title={language === 'tr' ? 'Kokpiti Aç' : 'Open Cockpit'}
                          >
                            <Compass className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              {language === 'tr' ? 'Yeni analiz başlatmak için:' : 'Start new session:'}
            </span>
            <button
              id="btn-dropdown-new-idea"
              type="button"
              onClick={handleNewVentureClick}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.common.newVenture}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
