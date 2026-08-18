import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  data: {
    factsCount: number;
    inferencesCount: number;
    assumptionsCount: number;
    totalSources: number;
  };
}

export const EvidenceDonutChart: React.FC<Props> = ({ data }) => {
  const { t } = useLanguage();
  const total = data.factsCount + data.inferencesCount + data.assumptionsCount;

  if (total === 0 && data.totalSources === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
        {t.common.insufficientEvidence}
      </div>
    );
  }

  const factPct = total > 0 ? Math.round((data.factsCount / total) * 100) : 0;
  const infPct = total > 0 ? Math.round((data.inferencesCount / total) * 100) : 0;
  const assumpPct = total > 0 ? Math.round((data.assumptionsCount / total) * 100) : 0;

  return (
    <div className="p-4 rounded-xl border bg-white/70 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
          {t.dashboard.evidenceDistribution}
        </span>
        <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
          {total} {t.common.findings} • {data.totalSources} {t.common.sources}
        </span>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {factPct > 0 && (
          <div
            style={{ width: `${factPct}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`${t.common.fact}: ${data.factsCount} (${factPct}%)`}
          />
        )}
        {infPct > 0 && (
          <div
            style={{ width: `${infPct}%` }}
            className="bg-sky-500 transition-all duration-300"
            title={`${t.common.inference}: ${data.inferencesCount} (${infPct}%)`}
          />
        )}
        {assumpPct > 0 && (
          <div
            style={{ width: `${assumpPct}%` }}
            className="bg-amber-500 transition-all duration-300"
            title={`${t.common.assumption}: ${data.assumptionsCount} (${assumpPct}%)`}
          />
        )}
      </div>

      {/* Numerical Evidence Breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-center">
          <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {t.common.fact}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {data.factsCount} <span className="text-[10px] font-normal text-slate-400">({factPct}%)</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 text-center">
          <div className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
            {t.common.inference}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {data.inferencesCount} <span className="text-[10px] font-normal text-slate-400">({infPct}%)</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
            {t.common.assumption}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {data.assumptionsCount} <span className="text-[10px] font-normal text-slate-400">({assumpPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
