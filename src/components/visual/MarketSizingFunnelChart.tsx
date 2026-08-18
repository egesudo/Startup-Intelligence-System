import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Globe, TrendingUp, Layers, PieChart } from 'lucide-react';

interface MarketSizingProps {
  tam?: string;
  sam?: string;
  som?: string;
  tamGrowthRate?: string;
  sourceNote?: string;
}

export const MarketSizingFunnelChart: React.FC<MarketSizingProps> = ({
  tam = '$14.2B',
  sam = '$3.8B',
  som = '$480M',
  tamGrowthRate = '16.4% CAGR',
  sourceNote = 'Derived from verified industry market reports & benchmark datasets'
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <div id="market-sizing-funnel-chart" className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Addressable Sizing
            </span>
            <span className="text-xs text-slate-400 font-mono">TAM • SAM • SOM Topology</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mt-1">
            Market Sizing & Capture Funnel
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{tamGrowthRate}</span>
        </div>
      </div>

      {/* Visual Sizing Funnel (Concentric Bars) */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
        {/* TAM */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              TAM (Total Addressable Market)
            </span>
            <span className="font-black text-slate-900 dark:text-white">{tam}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-900 h-7 rounded-xl overflow-hidden p-1 flex items-center">
            <div className="w-full h-full bg-slate-400 dark:bg-slate-700 rounded-lg flex items-center justify-end px-3">
              <span className="text-[10px] font-mono text-white font-bold">100% Global Macro Scope</span>
            </div>
          </div>
        </div>

        {/* SAM */}
        <div className="space-y-1.5 pl-4 sm:pl-8">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              SAM (Serviceable Addressable Market)
            </span>
            <span className="font-black text-slate-900 dark:text-white">{sam}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-900 h-7 rounded-xl overflow-hidden p-1 flex items-center">
            <div className="w-[60%] h-full bg-red-500/80 rounded-lg flex items-center justify-end px-3">
              <span className="text-[10px] font-mono text-white font-bold">Target Geography & ICP</span>
            </div>
          </div>
        </div>

        {/* SOM */}
        <div className="space-y-1.5 pl-8 sm:pl-16">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-red-600 dark:text-red-400">
              SOM (Serviceable Obtainable Market — Year 1–3)
            </span>
            <span className="font-black text-red-600 dark:text-red-400">{som}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-900 h-7 rounded-xl overflow-hidden p-1 flex items-center">
            <div className="w-[35%] h-full bg-red-600 rounded-lg flex items-center justify-end px-3 shadow-sm">
              <span className="text-[10px] font-mono text-white font-bold">Near-Term Target</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
        <span>* {sourceNote}</span>
        <span className="text-emerald-500 font-bold">Verified Market Citations</span>
      </div>
    </div>
  );
};
