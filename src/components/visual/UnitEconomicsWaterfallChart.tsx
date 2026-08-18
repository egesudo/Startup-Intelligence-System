import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, DollarSign, Percent, ArrowUpRight, BarChart2, ShieldCheck } from 'lucide-react';

interface UnitEconomicsWaterfallProps {
  grossMargin?: string | number;
  pricingPower?: 'WEAK' | 'MODERATE' | 'STRONG' | string;
  revenueModel?: string;
  pricingModel?: string;
  cacToLtvRatio?: string;
  paybackMonths?: number;
}

export const UnitEconomicsWaterfallChart: React.FC<UnitEconomicsWaterfallProps> = ({
  grossMargin = '75–85%',
  pricingPower = 'STRONG',
  revenueModel = 'Subscription & Usage Tiered',
  pricingModel = '$499 – $1,499 / mo B2B ACV',
  cacToLtvRatio = '3.8x – 5.2x',
  paybackMonths = 7
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Waterfall components
  const waterfallSteps = [
    { label: 'Gross Revenue (100%)', value: 100, color: 'bg-slate-900 dark:bg-white', text: '$1,000' },
    { label: 'COGS & Cloud Compute (-18%)', value: -18, color: 'bg-red-500', text: '-$180' },
    { label: 'Gross Profit Margin (+82%)', value: 82, color: 'bg-emerald-500', text: '$820 (82% GM)' },
    { label: 'Sales & Customer Acquisition (-22%)', value: -22, color: 'bg-amber-500', text: '-$220 (CAC amortized)' },
    { label: 'Net Contribution Margin (+60%)', value: 60, color: 'bg-red-600', text: '$600 Free Cash Flow' }
  ];

  return (
    <div id="unit-economics-waterfall-chart" className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Commercial Economics
            </span>
            <span className="text-xs text-slate-400 font-mono">Waterfall & Margin Model</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mt-1">
            Unit Economics & Contribution Waterfall
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {typeof grossMargin === 'string' ? grossMargin : `${grossMargin}%`} Gross Margin
          </span>
        </div>
      </div>

      {/* Waterfall Visualization Bars */}
      <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500">
          <span>Unit Revenue Breakdown (Normalized per $1,000 ACV)</span>
          <span>Target: Net Margin &gt; 50%</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          {waterfallSteps.map((step, idx) => {
            const isPositive = step.value > 0;
            const barWidth = Math.abs(step.value);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-slate-700 dark:text-slate-300 text-[11px]">
                  <span>{step.label}</span>
                  <span className="font-bold">{step.text}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full ${step.color} rounded-full transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Economics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">LTV / CAC Ratio</div>
          <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {cacToLtvRatio}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Benchmark: &gt; 3.0x</span>
        </div>

        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">CAC Payback</div>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
            {paybackMonths} Months
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Benchmark: &lt; 12 mo</span>
        </div>

        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Pricing Power</div>
          <div className="text-base font-bold font-mono text-red-600 dark:text-red-400 mt-1">
            {pricingPower}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Value-Based</span>
        </div>

        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Capital Intensity</div>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
            Seed Efficient
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Low CapEx</span>
        </div>
      </div>
    </div>
  );
};
