import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AgentIdentity } from './AgentIdentity';
import {
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  Sparkles,
  Edit3,
  Check,
  Award,
  AlertTriangle,
  Plus
} from 'lucide-react';

export interface PriorityActionData {
  id?: string;
  stepNumber: 1 | 2 | 3;
  action: string;
  rationale?: string;
  purpose?: string;
  validationTarget?: string;
  passFailMetric?: string;
  estimatedDays?: number;
  expectedDecisionImpact?: string;
  assignedAgent?: 'RESEARCHER' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE';
  milestones?: Array<{ phase: string; title: string; desc: string }>;
  isCompleted?: boolean;
}

interface DetailedPriorityActionCardProps {
  action: PriorityActionData;
  index: number;
  onToggleComplete?: () => void;
}

export const DetailedPriorityActionCard: React.FC<DetailedPriorityActionCardProps> = ({
  action,
  index,
  onToggleComplete
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const [isExpanded, setIsExpanded] = useState(index === 0);
  const [founderNotes, setFounderNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  // Default smart fallback milestones if none exist
  const defaultMilestones = [
    {
      phase: 'Days 1–3',
      title: 'Target Cohort Outreach',
      desc: 'Define 20 qualified ICP prospects and schedule structured discovery interviews.'
    },
    {
      phase: 'Days 4–7',
      title: 'Falsification Stress Test',
      desc: 'Run smoke test / problem validation questionnaire measuring willingness-to-pay.'
    },
    {
      phase: 'Days 8–14',
      title: 'Evidence Synthesis',
      desc: 'Audit conversion signals and pass/fail thresholds to update readiness parameters.'
    }
  ];

  const milestones = action.milestones || defaultMilestones;
  const isCompleted = action.isCompleted;

  // Determine assigned agent
  const assignedAgent: 'RESEARCHER' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE' = 
    action.assignedAgent || (index === 0 ? 'RESEARCHER' : index === 1 ? 'BUSINESS' : 'RED_TEAM');

  // Pass fail metric
  const passFail = action.passFailMetric || action.validationTarget || '≥ 15 target ICP interviews completed with >65% verified pain severity rating.';
  const decisionImpact = action.expectedDecisionImpact || action.rationale || '+8 pts to Problem Urgency, de-risks critical execution bottleneck.';

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderNotes.trim()) return;
    setSavedNotes([...savedNotes, founderNotes.trim()]);
    setFounderNotes('');
  };

  return (
    <div
      id={`priority-action-card-${index + 1}`}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isCompleted
          ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-80'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-red-500/40'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start space-x-3.5 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete && onToggleComplete();
            }}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors mt-0.5 cursor-pointer ${
              isCompleted
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-red-500'
            }`}
            title={isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
          >
            {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-mono font-bold text-slate-500">0{index + 1}</span>}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                ACTION 0{index + 1} • {action.estimatedDays || 14} DAYS
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Lead Agent: {assignedAgent}
              </span>
            </div>

            <h3
              className={`text-sm sm:text-base font-bold tracking-tight ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {action.action}
            </h3>

            {!isExpanded && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl">
                {action.purpose || action.rationale || passFail}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Deep-Dive Details */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in text-xs">
          {/* Quantitative Falsification Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 space-y-1">
              <div className="flex items-center space-x-1.5 text-red-600 dark:text-red-400 font-bold font-mono text-[10px] uppercase">
                <Target className="w-3.5 h-3.5 text-red-500" />
                <span>Pass / Fail Quantitative Falsification Metric</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                {passFail}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[10px] uppercase">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Readiness Score & De-risking Uplift</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                {decisionImpact}
              </p>
            </div>
          </div>

          {/* 3-Phase Execution Playbook Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Step-by-Step Execution Playbook
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {milestones.map((m, mIdx) => (
                <div
                  key={mIdx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-red-600 dark:text-red-400">
                    <span>Phase 0{mIdx + 1}</span>
                    <span className="text-slate-400">{m.phase}</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {m.title}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Founder Execution Trial Log */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-red-500" />
                Founder Trial & Evidence Log
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {savedNotes.length} Evidence Records
              </span>
            </div>

            {/* Saved Notes List */}
            {savedNotes.length > 0 && (
              <div className="space-y-1.5 pb-2">
                {savedNotes.map((note, nIdx) => (
                  <div
                    key={nIdx}
                    className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 flex items-start gap-2"
                  >
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={founderNotes}
                onChange={(e) => setFounderNotes(e.target.value)}
                placeholder="Log interview findings, conversion rate, or LOI counts..."
                className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500 font-sans"
              />
              <button
                type="submit"
                disabled={!founderNotes.trim()}
                className="px-3 py-2 rounded-lg text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Result</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
