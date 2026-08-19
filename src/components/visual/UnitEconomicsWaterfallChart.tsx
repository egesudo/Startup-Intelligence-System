import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ArrowUpRight, 
  BarChart2, 
  ShieldCheck, 
  Layers, 
  PieChart, 
  CheckCircle2,
  Zap,
  Info
} from 'lucide-react';
import { WaterfallStep, CogsItem, PricingTierDetail } from '../../types/domain';

interface UnitEconomicsWaterfallProps {
  grossMargin?: string | number;
  grossMarginRange?: string;
  pricingPower?: 'WEAK' | 'MODERATE' | 'STRONG' | string;
  revenueModel?: string;
  pricingModel?: string;
  cacToLtvRatio?: string;
  paybackMonths?: number;
  capitalIntensity?: string;
  capitalIntensityDescription?: string;
  waterfallSteps?: WaterfallStep[];
  cogsBreakdown?: CogsItem[];
  pricingTiers?: PricingTierDetail[];
  archetypeDisplayName?: string;
}

export const UnitEconomicsWaterfallChart: React.FC<UnitEconomicsWaterfallProps> = ({
  grossMargin = '78%',
  grossMarginRange = '75% – 82%',
  pricingPower = 'STRONG',
  revenueModel = 'Subscription & Usage Tiered',
  pricingModel = '$249 – $899 / mo B2B ACV',
  cacToLtvRatio = '4.2x – 5.5x',
  paybackMonths = 7,
  capitalIntensity = 'LOW_CAPEX_SOFTWARE',
  capitalIntensityDescription = 'Seed-Efficient pure software model with zero inventory and automated provisioning.',
  waterfallSteps,
  cogsBreakdown,
  pricingTiers,
  archetypeDisplayName
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();

  // Fallback default dynamic steps if none provided
  const steps: WaterfallStep[] = (waterfallSteps && waterfallSteps.length > 0) ? waterfallSteps : [
    { label: language === 'tr' ? 'Brüt Gelir (Normalized per $1,000 ACV)' : 'Gross Revenue (Normalized per $1,000 ACV)', percentage: 100, amountNormalized: '$1,000', stepType: 'gross_revenue', color: 'bg-slate-900 dark:bg-white', description: 'Total invoiced subscription revenue' },
    { label: language === 'tr' ? 'COGS: Altyapı, API & Bulut Maliyeti' : 'COGS: Cloud Hosting, APIs & Compute', percentage: -14, amountNormalized: '-$140', stepType: 'cogs', color: 'bg-red-500', description: 'Per-transaction compute & serverless tiers' },
    { label: language === 'tr' ? 'COGS: Müşteri Entegrasyon & Ödeme Altyapısı' : 'COGS: Payment Gateway & Setup Ops', percentage: -8, amountNormalized: '-$80', stepType: 'cogs', color: 'bg-rose-500', description: 'Gateway processing & setup support' },
    { label: language === 'tr' ? 'Brüt Kâr Marjı (78% GM Yapısı)' : 'Gross Profit Margin (78% GM Profile)', percentage: 78, amountNormalized: '$780 (78% GM)', stepType: 'gross_profit', color: 'bg-emerald-500', description: 'Gross profit before customer acquisition' },
    { label: language === 'tr' ? 'Satış & Pazarlama: Müşteri Edinme (CAC Amortized)' : 'Sales & Marketing: Acquisition (CAC Amortized)', percentage: -22, amountNormalized: '-$220', stepType: 'cac', color: 'bg-amber-500', description: 'Acquisition marketing & SDR outreach' },
    { label: language === 'tr' ? 'Müşteri Başarısı & Hesap Tutundurma' : 'Customer Success & Retention Operations', percentage: -8, amountNormalized: '-$80', stepType: 'retention_ops', color: 'bg-purple-500', description: 'Onboarding and proactive engagement' },
    { label: language === 'tr' ? 'Net Katkı Marjı / Serbest Nakit Akışı' : 'Net Contribution Margin / Free Cash Flow', percentage: 48, amountNormalized: '$480 (48% Net Margin)', stepType: 'net_contribution', color: 'bg-blue-600 dark:bg-blue-500', description: 'Operating cash surplus to reinvest in expansion' }
  ];

  const displayGm = typeof grossMargin === 'number' ? `${grossMargin}%` : grossMargin;

  return (
    <div id="unit-economics-waterfall-chart" className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {archetypeDisplayName || (language === 'tr' ? 'Ticari Birim Ekonomi' : 'Commercial Economics')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {language === 'tr' ? 'Şelale & Marj Modeli' : 'Waterfall & Margin Model'}
            </span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mt-1.5 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-500" />
            <span>{language === 'tr' ? 'Birim Ekonomi & Katkı Payı Şelalesi (Waterfall)' : 'Unit Economics & Contribution Waterfall'}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
            {grossMarginRange || displayGm} {language === 'tr' ? 'Brüt Marj' : 'Gross Margin'}
          </span>
        </div>
      </div>

      {/* Waterfall Visualization Bars */}
      <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
          <span>{language === 'tr' ? 'Birim Gelir Dağılımı ($1,000 ACV Normalize)' : 'Unit Revenue Breakdown (Normalized per $1,000 ACV)'}</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {language === 'tr' ? 'Hedef: Net Katkı Marjı > %40' : 'Target: Net Margin > 40%'}
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {steps.map((step, idx) => {
            const barWidth = Math.min(100, Math.max(8, Math.abs(step.percentage)));
            const isNegative = step.percentage < 0;
            const isHighlight = step.stepType === 'gross_profit' || step.stepType === 'net_contribution';

            return (
              <div key={idx} className="space-y-1.5 p-2 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-colors">
                <div className="flex justify-between items-baseline text-slate-700 dark:text-slate-300 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${step.color || 'bg-slate-400'}`} />
                    <strong className={isHighlight ? 'text-slate-900 dark:text-white font-bold' : ''}>
                      {step.label}
                    </strong>
                  </span>
                  <span className={`font-bold ${isNegative ? 'text-red-500' : isHighlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {step.amountNormalized}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full ${step.color || 'bg-emerald-500'} rounded-full transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {step.description && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pl-3.5">
                    {step.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* COGS Detailed Breakdown if available */}
      {cogsBreakdown && cogsBreakdown.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 uppercase">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-red-500" />
              <span>{language === 'tr' ? 'Satılan Malın Maliyeti (COGS) Detayları' : 'Cost of Goods Sold (COGS) Breakdown'}</span>
            </span>
            <span className="text-[10px] font-normal lowercase">{language === 'tr' ? 'doğrudan değişken maliyetler' : 'direct delivery variable costs'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cogsBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">
                    {item.percentage}% COGS
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{item.costAmount}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Economics Summary 4-KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">LTV / CAC Ratio</div>
          <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
            {cacToLtvRatio}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Benchmark: &gt; 3.0x</span>
        </div>

        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">CAC Payback</div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {paybackMonths} {language === 'tr' ? 'Ay' : 'Months'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Benchmark: &lt; 12 mo</span>
        </div>

        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Pricing Power</div>
          <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
            {pricingPower}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Value-Based ROI</span>
        </div>

        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Capital Model</div>
          <div className="text-sm font-black font-mono text-slate-900 dark:text-white truncate" title={capitalIntensity}>
            {capitalIntensity === 'LOW_CAPEX_SOFTWARE' ? 'Seed Efficient' : capitalIntensity === 'WORKING_CAPITAL_INTENSIVE' ? 'Liquidity Focused' : 'Moderate Seed'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block truncate">
            {capitalIntensity === 'LOW_CAPEX_SOFTWARE' ? 'Low CapEx' : 'Managed Runway'}
          </span>
        </div>
      </div>

      {/* Tailored Pricing Tiers if available */}
      {pricingTiers && pricingTiers.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'tr' ? 'Önerilen 3 Kademeli Fiyatlandırma Mimarisi' : 'Optimized 3-Tier Commercial Pricing Architecture'}</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              {language === 'tr' ? 'Değer Odaklı Dilimleme' : 'Value-Segmented'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                  idx === 1 
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20' 
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      {tier.tierName}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tier.marginEstimate}
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {tier.price}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {tier.billingPeriod} • <span className="text-slate-600 dark:text-slate-300 font-medium">{tier.targetSegment}</span>
                  </div>

                  <ul className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300">
                    {tier.keyFeatures.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
