import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Scale, Search, ShieldAlert, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface DisagreementItem {
  topic: string;
  researchPosition: string;
  businessPosition?: string;
  redTeamPosition: string;
  judgeInterpretation: string;
  confidence?: string;
}

interface CrossAgentArbitrationProps {
  disagreements?: DisagreementItem[];
}

export const CrossAgentArbitrationTable: React.FC<CrossAgentArbitrationProps> = ({
  disagreements = []
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const displayDisagreements: DisagreementItem[] = disagreements.length > 0 ? disagreements : [
    {
      topic: 'Customer Acquisition Velocity & CAC',
      researchPosition: 'High intent in niche oncology communities with organic word-of-mouth growth potential.',
      redTeamPosition: 'Long compliance reviews (>9 months) and high trust barriers will balloon enterprise CAC.',
      judgeInterpretation: 'Validates Red Team concern. Recommend targeting Tier-2 regional clinics before academic hospitals.',
      confidence: 'HIGH'
    },
    {
      topic: 'Pricing Power & Budget Ownership',
      researchPosition: 'B2B software budget existing under trial recruitment R&D lines ($10k+/trial).',
      redTeamPosition: 'Clinics lack discretionary software budget; biotech sponsors dictate spend allocation.',
      judgeInterpretation: 'Pivot pricing structure to bill sponsors per successfully enrolled cohort rather than clinic subscriptions.',
      confidence: 'HIGH'
    },
    {
      topic: 'Defensibility Against Epic / Cerner Integration',
      researchPosition: 'First-mover matching dataset creates specialized data moat.',
      redTeamPosition: 'EHR incumbents can launch native clinical trial module in upcoming release cycle.',
      judgeInterpretation: 'Moat resides in sponsor relationships and deep biomarker taxonomy, not EHR sync alone.',
      confidence: 'MEDIUM'
    }
  ];

  return (
    <div id="cross-agent-arbitration-table" className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Judicial Arbitration
            </span>
            <span className="text-xs text-slate-400 font-mono">Cross-Agent Dispute Resolution</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mt-1">
            Arbitrated Cross-Agent Tensions & Final Verdicts
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {displayDisagreements.length} Tensions Arbitrated
        </span>
      </div>

      <div className="space-y-3.5">
        {displayDisagreements.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                TENSION 0{idx + 1}: {item.topic}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                Confidence: {item.confidence || 'HIGH'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Researcher / Bull */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase">
                  <Search className="w-3 h-3 text-slate-400" />
                  <span>Researcher Evidence Thesis</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  {item.researchPosition}
                </p>
              </div>

              {/* Red Team / Adversarial */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase">
                  <ShieldAlert className="w-3 h-3 text-red-500" />
                  <span>Red Team Adversarial Challenge</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  {item.redTeamPosition}
                </p>
              </div>
            </div>

            {/* Judge Arbitration Ruling */}
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase">
                <Scale className="w-3.5 h-3.5 text-red-500" />
                <span>Judge Final Arbitration Ruling</span>
              </div>
              <p className="text-xs text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                {item.judgeInterpretation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
