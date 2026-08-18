import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { CompetitorProfile } from '../../types/domain';
import { Crosshair, ShieldAlert, TrendingUp, Layers, ExternalLink } from 'lucide-react';

interface CompetitorPositioningChartProps {
  competitors: CompetitorProfile[];
  ventureName?: string;
}

export const CompetitorPositioningChart: React.FC<CompetitorPositioningChartProps> = ({
  competitors = [],
  ventureName = 'Your Venture'
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  // If empty, supply representative benchmark competitors
  const displayCompetitors = competitors.length > 0 ? competitors : [
    {
      name: 'Legacy Incumbent',
      category: 'DIRECT' as const,
      coreAdvantage: 'Established distribution & multi-year enterprise contracts',
      coreVulnerability: 'Slow release cycles, high implementation cost, legacy tech stack',
      marketShare: '45%'
    },
    {
      name: 'Point-Solution Startup',
      category: 'INDIRECT' as const,
      coreAdvantage: 'Fast onboarding & modern UI',
      coreVulnerability: 'Lacks end-to-end integration and workflow depth',
      marketShare: '15%'
    },
    {
      name: 'Manual Spreadsheets / In-House',
      category: 'STATUS_QUO' as const,
      coreAdvantage: 'Zero direct software subscription cost',
      coreVulnerability: 'Massive human error rate, zero automation, unscalable',
      marketShare: '30%'
    }
  ];

  return (
    <div id="competitor-positioning-chart" className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Market Topography
            </span>
            <span className="text-xs text-slate-400 font-mono">2x2 Positioning & Moat Map</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mt-1">
            Competitor Positioning & Vulnerability Matrix
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {displayCompetitors.length} Evaluated Players
        </span>
      </div>

      {/* 2x2 Positioning Map (SVG visual) */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between text-[11px] font-mono text-slate-500 font-bold">
          <span>High Defensibility / Workflow Depth ↑</span>
          <span>Target: Top-Right Quadrant</span>
        </div>

        <div className="relative h-64 w-full bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-4">
          {/* Axis Lines */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200 dark:bg-slate-800 border-dashed" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-slate-800 border-dashed" />

          {/* Quadrant Labels */}
          <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-400">High Defensibility • High Cost</div>
          <div className="absolute top-2 right-3 text-[10px] font-mono text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded">
            ★ UNICORN TARGET (High Moat • High Speed)
          </div>
          <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400">Legacy Status Quo (Low Moat)</div>
          <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400">Commoditized Point-Tool</div>

          {/* Venture Position (Top-Right Target) */}
          <div className="absolute top-10 right-14 flex items-center gap-2 animate-pulse">
            <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white dark:border-slate-950 shadow-md" />
            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              {ventureName} (Disruptor)
            </span>
          </div>

          {/* Competitor 1 (Top-Left Incumbent) */}
          <div className="absolute top-12 left-16 flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-400 dark:bg-slate-600 border border-white dark:border-slate-950" />
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
              {displayCompetitors[0]?.name || 'Incumbents'}
            </span>
          </div>

          {/* Competitor 2 (Bottom-Right Point Tool) */}
          <div className="absolute bottom-12 right-20 flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white dark:border-slate-950" />
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
              {displayCompetitors[1]?.name || 'Point Solutions'}
            </span>
          </div>

          {/* Competitor 3 (Bottom-Left Status Quo) */}
          <div className="absolute bottom-10 left-12 flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-white dark:border-slate-950" />
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
              {displayCompetitors[2]?.name || 'Manual / In-House'}
            </span>
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-500 font-bold pt-1">
          <span>← Low Velocity / High Friction</span>
          <span>High Velocity / Low Friction →</span>
        </div>
      </div>

      {/* Structured Competitor Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase font-bold text-slate-400">
              <th className="py-2.5 px-3">Competitor / Player</th>
              <th className="py-2.5 px-3">Archetype</th>
              <th className="py-2.5 px-3">Core Advantage</th>
              <th className="py-2.5 px-3">Fatal Vulnerability</th>
              <th className="py-2.5 px-3 text-right">Threat Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {displayCompetitors.map((comp, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors">
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono">
                  {comp.name}
                </td>
                <td className="py-3 px-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {comp.category || 'DIRECT'}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs">
                  {comp.coreAdvantage || 'Installed base scale'}
                </td>
                <td className="py-3 px-3 text-red-600 dark:text-red-400 max-w-xs">
                  {comp.coreVulnerability || 'High friction & legacy lock-in'}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    idx === 0
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {idx === 0 ? 'HIGH' : 'MODERATE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
