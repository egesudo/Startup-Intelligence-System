import React from 'react';
import { 
  Search, 
  TrendingUp, 
  ShieldAlert, 
  Scale, 
  Compass,
  Telescope,
  Briefcase,
  AlertTriangle,
  Target
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type AgentRoleType = 'RESEARCHER' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE' | 'DECISION_MAKER';

interface AgentIdentityProps {
  agent: AgentRoleType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showRole?: boolean;
  className?: string;
}

export const getAgentConfig = (agent: AgentRoleType) => {
  switch (agent) {
    case 'RESEARCHER':
      return {
        icon: Search,
        altIcon: Telescope,
        key: 'researcher' as const,
        accentBg: 'bg-red-500/10 dark:bg-red-500/15',
        accentBorder: 'border-red-500/30',
        accentText: 'text-red-600 dark:text-red-400',
        view: 'report_research' as const
      };
    case 'BUSINESS':
      return {
        icon: TrendingUp,
        altIcon: Briefcase,
        key: 'business' as const,
        accentBg: 'bg-red-500/10 dark:bg-red-500/15',
        accentBorder: 'border-red-500/30',
        accentText: 'text-red-600 dark:text-red-400',
        view: 'report_business' as const
      };
    case 'RED_TEAM':
      return {
        icon: ShieldAlert,
        altIcon: AlertTriangle,
        key: 'redTeam' as const,
        accentBg: 'bg-red-500/15 dark:bg-red-500/20',
        accentBorder: 'border-red-500/40',
        accentText: 'text-red-600 dark:text-red-400',
        view: 'report_red_team' as const
      };
    case 'JUDGE':
      return {
        icon: Scale,
        altIcon: Scale,
        key: 'judge' as const,
        accentBg: 'bg-red-500/10 dark:bg-red-500/15',
        accentBorder: 'border-red-500/30',
        accentText: 'text-red-600 dark:text-red-400',
        view: 'report_judge' as const
      };
    case 'DECISION_MAKER':
    default:
      return {
        icon: Compass,
        altIcon: Target,
        key: 'decisionMaker' as const,
        accentBg: 'bg-red-500/15 dark:bg-red-500/20',
        accentBorder: 'border-red-500/40',
        accentText: 'text-red-600 dark:text-red-400',
        view: 'dashboard' as const
      };
  }
};

export const AgentIdentity: React.FC<AgentIdentityProps> = ({
  agent,
  size = 'md',
  showLabel = true,
  showRole = false,
  className = ''
}) => {
  const { t } = useLanguage();
  const config = getAgentConfig(agent);
  const Icon = config.icon;
  const agentInfo = t.agents[config.key];

  const iconSizes = {
    sm: 'w-6 h-6 p-1 rounded-md text-xs',
    md: 'w-8 h-8 p-1.5 rounded-lg text-sm',
    lg: 'w-11 h-11 p-2.5 rounded-xl text-base'
  };

  const svgSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      <div
        className={`flex items-center justify-center border shrink-0 ${iconSizes[size]} ${config.accentBg} ${config.accentBorder} ${config.accentText}`}
      >
        <Icon className={svgSizes[size]} />
      </div>
      {(showLabel || showRole) && (
        <div className="min-w-0">
          {showLabel && (
            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
              {agentInfo.name}
            </div>
          )}
          {showRole && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {agentInfo.role}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
