import React from 'react';
import { useVenture } from '../../context/VentureContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { RecentSessionsDropdown } from './RecentSessionsDropdown';
import { 
  Compass, 
  Plus, 
  Moon, 
  Sun,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen = false }) => {
  const { setActiveView } = useVenture();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header
      id="app-header"
      className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 select-none transition-colors duration-200"
    >
      {/* Brand & Venture Switcher */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
        {/* Sidebar Drawer Toggle Button */}
        {onToggleSidebar && (
          <button
            id="btn-toggle-sidebar"
            type="button"
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSidebarOpen
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title={isSidebarOpen ? 'Hide Sessions Sidebar' : 'Show Sessions Sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Brand Home Button */}
        <button
          id="btn-brand-home"
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold tracking-tight hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-red-600/10 dark:bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
            <Compass className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight hidden sm:inline">
            {t.common.appName}
          </span>
        </button>

        {/* Recent Sessions Dropdown Switcher */}
        <RecentSessionsDropdown onOpenSidebar={onToggleSidebar} />
      </div>

      {/* Controls & Primary Action */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 shrink-0">
        {/* Language Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <button
            id="btn-lang-en"
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-md transition-all font-bold cursor-pointer ${
              language === 'en'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="English"
          >
            EN
          </button>
          <button
            id="btn-lang-tr"
            type="button"
            onClick={() => setLanguage('tr')}
            className={`px-2 py-1 rounded-md transition-all font-bold cursor-pointer ${
              language === 'tr'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Türkçe"
          >
            TR
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          id="btn-theme-toggle"
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Primary CTA */}
        <button
          id="btn-new-venture-header"
          type="button"
          onClick={() => setActiveView('input')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-sm hover:shadow-red-600/20 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">{t.common.newVenture}</span>
        </button>
      </div>
    </header>
  );
};

