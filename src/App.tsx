/**
 * Startup Intelligence - Multi-Agent Architecture
 * Global Product UX + Intelligence Optimization
 */

import React from 'react';
import { VentureProvider, useVenture } from './context/VentureContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';
import { IdeaInputView } from './views/IdeaInputView';
import { AnalysisProgressView } from './views/AnalysisProgressView';
import { AgentWorkspaceView } from './views/AgentWorkspaceView';
import { ResearchReportView } from './views/ResearchReportView';
import { BusinessReportView } from './views/BusinessReportView';
import { RedTeamReportView } from './views/RedTeamReportView';
import { JudgeReportView } from './views/JudgeReportView';
import { DecisionDashboardView } from './views/DecisionDashboardView';
import { Loader2, AlertCircle, X, RefreshCw } from 'lucide-react';

const MainViewRouter: React.FC = () => {
  const { activeView, isLoading, error, refreshVentures, setActiveView } = useVenture();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
          {t.common.loading}
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'input':
        return <IdeaInputView />;
      case 'analysis':
        return <AnalysisProgressView />;
      case 'workspace':
        return <AgentWorkspaceView />;
      case 'report_research':
        return <ResearchReportView />;
      case 'report_business':
        return <BusinessReportView />;
      case 'report_red_team':
        return <RedTeamReportView />;
      case 'report_judge':
        return <JudgeReportView />;
      case 'dashboard':
        return <DecisionDashboardView />;
      default:
        return <IdeaInputView />;
    }
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 flex items-center justify-between text-xs transition-all shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-semibold">{t.common.error}: </span>
              <span>{error}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => refreshVentures()}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center space-x-1 font-mono transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => setActiveView('input')}
              className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono transition-colors"
            >
              New Idea
            </button>
          </div>
        </div>
      )}
      {renderActiveView()}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <VentureProvider>
          <AppLayout>
            <MainViewRouter />
          </AppLayout>
        </VentureProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
