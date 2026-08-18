import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  dimensions: {
    problemUrgency: number; // 0-25
    marketViability: number; // 0-25
    defensibilityMoat: number; // 0-25
    executionRisk: number; // 0-25
  };
}

export const DimensionBarChart: React.FC<Props> = ({ dimensions }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const items = [
    {
      id: 'problem',
      label: t.dashboard.problemUrgency,
      score: dimensions.problemUrgency,
      max: 25,
      weight: '25%'
    },
    {
      id: 'viability',
      label: t.dashboard.marketViability,
      score: dimensions.marketViability,
      max: 25,
      weight: '25%'
    },
    {
      id: 'moat',
      label: t.dashboard.defensibilityMoat,
      score: dimensions.defensibilityMoat,
      max: 25,
      weight: '25%'
    },
    {
      id: 'risk',
      label: t.dashboard.executionRisk,
      score: dimensions.executionRisk,
      max: 25,
      weight: '25%'
    }
  ];

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {items.map((item) => {
          const percent = Math.min(100, Math.max(0, (item.score / item.max) * 100));
          const isHigh = item.score >= 18;
          const isMed = item.score >= 12 && item.score < 18;

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border bg-white/70 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 shadow-xs transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {item.label}
                </span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                  {item.score}/{item.max}
                </span>
              </div>

              {/* Progress Bar with Red Accent */}
              <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-red-500 dark:bg-red-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>{percent.toFixed(0)}%</span>
                <span className="uppercase tracking-tight">
                  {isHigh ? t.severities.high : isMed ? t.severities.medium : t.severities.low}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
