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
import { Loader2, AlertCircle } from 'lucide-react';

const MainViewRouter: React.FC = () => {
  const { activeView, isLoading, error } = useVenture();
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

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-400 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold">{t.common.error}</h3>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

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
      return <DecisionDashboardView />;
  }
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
