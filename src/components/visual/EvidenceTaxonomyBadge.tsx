import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export type EvidenceTaxonomy = 'FACT' | 'INFERENCE' | 'ASSUMPTION' | string;

interface Props {
  type?: EvidenceTaxonomy;
  className?: string;
  size?: 'sm' | 'md';
}

export const EvidenceTaxonomyBadge: React.FC<Props> = ({ type = 'FACT', className = '', size = 'sm' }) => {
  const { t } = useLanguage();
  const normalized = (type || 'FACT').toUpperCase();

  const isFact = normalized.includes('FACT') || normalized.includes('EMPIRICAL') || normalized.includes('VERIFIED');
  const isInference = normalized.includes('INFERENCE') || normalized.includes('ANALYSIS') || normalized.includes('DERIVED');
  const isAssumption = normalized.includes('ASSUMPTION') || normalized.includes('HYPOTHESIS') || normalized.includes('UNVALIDATED');

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (isFact) {
    return (
      <span
        className={`inline-flex items-center font-mono font-bold uppercase rounded-md tracking-wider border bg-emerald-500/10 text-emerald-500 border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 ${sizeClasses} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
        {t.common.fact}
      </span>
    );
  }

  if (isInference) {
    return (
      <span
        className={`inline-flex items-center font-mono font-bold uppercase rounded-md tracking-wider border bg-sky-500/10 text-sky-600 border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 ${sizeClasses} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 shrink-0" />
        {t.common.inference}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase rounded-md tracking-wider border bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 shrink-0" />
      {t.common.assumption}
    </span>
  );
};
