import React from 'react';
import { VentureStatus, AIRecommendationType, FounderDecisionType, RiskSeverity } from '../../types/domain';
import { useLanguage } from '../../context/LanguageContext';

export const StatusBadge: React.FC<{ status: VentureStatus }> = ({ status }) => {
  const { t } = useLanguage();

  switch (status) {
    case 'draft':
      return (
        <span id="badge-status-draft" className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          Draft
        </span>
      );
    case 'clarifying':
      return (
        <span id="badge-status-clarifying" className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          Q&A Active
        </span>
      );
    case 'analyzing':
      return (
        <span id="badge-status-analyzing" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/40 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Agents Active
        </span>
      );
    case 'evaluated':
      return (
        <span id="badge-status-evaluated" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t.common.completed}
        </span>
      );
    case 'decided':
      return (
        <span id="badge-status-decided" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          {t.dashboard.founderDecision}
        </span>
      );
    default:
      return null;
  }
};

export const RecommendationBadge: React.FC<{ recommendation: AIRecommendationType }> = ({ recommendation }) => {
  const { t } = useLanguage();

  switch (recommendation) {
    case 'PROCEED_CONFIDENTLY':
      return (
        <span id="badge-rec-proceed" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs font-mono">
          {t.recommendations.build}
        </span>
      );
    case 'PROCEED_WITH_VALIDATION':
      return (
        <span id="badge-rec-validate" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black tracking-wide bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 shadow-xs font-mono">
          {t.recommendations.validateFirst}
        </span>
      );
    case 'PIVOT_REQUIRED':
      return (
        <span id="badge-rec-pivot" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs font-mono">
          {t.recommendations.redesign}
        </span>
      );
    case 'DO_NOT_PROCEED':
    case 'STOP':
      return (
        <span id="badge-rec-stop" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black tracking-wide bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40 shadow-xs font-mono">
          {t.recommendations.doNotPursue}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono">
          {recommendation || t.common.insufficientEvidence}
        </span>
      );
  }
};

export const DecisionBadge: React.FC<{ choice: FounderDecisionType }> = ({ choice }) => {
  switch (choice) {
    case 'BUILD':
      return (
        <span id="badge-choice-build" className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
          BUILD
        </span>
      );
    case 'VALIDATE':
      return (
        <span id="badge-choice-validate" className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-black bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 font-mono">
          VALIDATE
        </span>
      );
    case 'PIVOT':
      return (
        <span id="badge-choice-pivot" className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono">
          PIVOT
        </span>
      );
    case 'KILL':
      return (
        <span id="badge-choice-kill" className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-black bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40 font-mono">
          KILL
        </span>
      );
    default:
      return null;
  }
};

export const SeverityBadge: React.FC<{ severity: RiskSeverity | string }> = ({ severity }) => {
  const { t } = useLanguage();
  const normalized = (severity || 'HIGH').toUpperCase();

  switch (normalized) {
    case 'CRITICAL':
      return (
        <span id="badge-sev-critical" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40 font-mono">
          {t.severities.critical}
        </span>
      );
    case 'HIGH':
      return (
        <span id="badge-sev-high" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-mono">
          {t.severities.high}
        </span>
      );
    case 'MEDIUM':
      return (
        <span id="badge-sev-medium" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono">
          {t.severities.medium}
        </span>
      );
    case 'LOW':
      return (
        <span id="badge-sev-low" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-mono">
          {t.severities.low}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-mono">
          {severity}
        </span>
      );
  }
};
