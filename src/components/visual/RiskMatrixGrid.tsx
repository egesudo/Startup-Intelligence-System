import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldAlert, AlertTriangle, AlertCircle } from 'lucide-react';

export interface RiskItem {
  id?: string;
  title: string;
  category?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  impact?: string;
  evidenceStatus?: string;
}

interface Props {
  risks: RiskItem[];
}

export const RiskMatrixGrid: React.FC<Props> = ({ risks }) => {
  const { t } = useLanguage();

  if (!risks || risks.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        {t.common.insufficientEvidence}
      </div>
    );
  }

  const criticals = risks.filter(r => (r.severity || '').toUpperCase() === 'CRITICAL');
  const highs = risks.filter(r => (r.severity || '').toUpperCase() === 'HIGH');
  const mediums = risks.filter(r => (r.severity || '').toUpperCase() === 'MEDIUM');
  const lows = risks.filter(r => (r.severity || '').toUpperCase() === 'LOW');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center justify-between text-[11px] font-bold text-red-600 dark:text-red-400">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {t.severities.critical}
            </span>
            <span className="font-mono">{criticals.length}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
          <div className="flex items-center justify-between text-[11px] font-bold text-red-500 dark:text-red-400">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.severities.high}
            </span>
            <span className="font-mono">{highs.length}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {t.severities.medium}
            </span>
            <span className="font-mono">{mediums.length}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-500/20">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span>{t.severities.low}</span>
            <span className="font-mono">{lows.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {risks.slice(0, 5).map((risk, idx) => {
          const isCrit = (risk.severity || '').toUpperCase() === 'CRITICAL';
          const isHigh = (risk.severity || '').toUpperCase() === 'HIGH';

          return (
            <div
              key={risk.id || idx}
              className={`p-3 rounded-lg border text-xs transition-all ${
                isCrit
                  ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                  : isHigh
                  ? 'bg-red-500/5 border-red-500/20 text-slate-800 dark:text-slate-200'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{risk.title}</div>
                <span
                  className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                    isCrit
                      ? 'bg-red-500 text-white'
                      : isHigh
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {risk.severity || 'HIGH'}
                </span>
              </div>
              {risk.impact && (
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {risk.impact}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
