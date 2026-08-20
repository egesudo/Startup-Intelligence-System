import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  minScore?: number;
  label?: string;
  sublabel?: string;
  tier?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'arc' | 'circle' | 'semi-circle' | 'linear';
  colorScheme?: 'auto' | 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'indigo';
  showTicks?: boolean;
  showMinMax?: boolean;
  showPercent?: boolean;
  thickness?: number;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score = 0,
  maxScore = 100,
  minScore = 0,
  label,
  sublabel,
  tier,
  size = 'md',
  variant = 'arc',
  colorScheme = 'auto',
  showTicks = false,
  showMinMax = true,
  showPercent = false,
  thickness,
  className = '',
  interactive = false,
  onClick
}) => {
  const { theme } = useTheme();

  // Clamp and normalize score
  const safeScore = Math.max(minScore, Math.min(maxScore, Number.isFinite(score) ? score : 0));
  const percentage = Math.round(((safeScore - minScore) / (maxScore - minScore)) * 100) || 0;

  // Resolve color palette
  const resolveColors = () => {
    if (colorScheme !== 'auto') {
      switch (colorScheme) {
        case 'emerald':
          return {
            stroke: '#10b981',
            glow: 'rgba(16, 185, 129, 0.25)',
            text: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
          };
        case 'blue':
          return {
            stroke: '#3b82f6',
            glow: 'rgba(59, 130, 246, 0.25)',
            text: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
          };
        case 'amber':
          return {
            stroke: '#f59e0b',
            glow: 'rgba(245, 158, 11, 0.25)',
            text: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20'
          };
        case 'purple':
          return {
            stroke: '#a855f7',
            glow: 'rgba(168, 85, 247, 0.25)',
            text: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20'
          };
        case 'red':
          return {
            stroke: '#ef4444',
            glow: 'rgba(239, 68, 68, 0.25)',
            text: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20'
          };
        case 'indigo':
          return {
            stroke: '#6366f1',
            glow: 'rgba(99, 102, 241, 0.25)',
            text: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20'
          };
      }
    }

    // Auto based on percentage
    if (percentage >= 80) {
      return {
        stroke: '#10b981',
        glow: 'rgba(16, 185, 129, 0.25)',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20'
      };
    }
    if (percentage >= 65) {
      return {
        stroke: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.25)',
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
      };
    }
    if (percentage >= 50) {
      return {
        stroke: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.25)',
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20'
      };
    }
    return {
      stroke: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.25)',
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20'
    };
  };

  const colors = resolveColors();

  // Dimension pixel sizing
  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs': return 70;
      case 'sm': return 100;
      case 'md': return 150;
      case 'lg': return 200;
      case 'xl': return 260;
      default: return 150;
    }
  };

  const dim = getDimension();
  const strokeWidth = thickness || Math.max(4, Math.round(dim * 0.085));
  const isDark = theme === 'dark';
  const trackColor = isDark ? '#1e293b' : '#e2e8f0';

  // ─────────────────────────────────────────────────────────────
  // LINEAR VARIANT
  // ─────────────────────────────────────────────────────────────
  if (variant === 'linear') {
    return (
      <div 
        className={`w-full space-y-1.5 ${interactive ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        {(label || maxScore) && (
          <div className="flex items-center justify-between text-xs">
            {label && (
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                {label}
              </span>
            )}
            <div className="flex items-center gap-1.5 shrink-0 font-mono">
              <span className={`font-bold ${colors.text}`}>
                {safeScore}
              </span>
              <span className="text-slate-400 text-[11px]">
                / {maxScore}
              </span>
            </div>
          </div>
        )}

        <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" style={{ height: strokeWidth }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: colors.stroke,
              boxShadow: `0 0 8px ${colors.glow}`
            }}
          />
        </div>

        {sublabel && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{sublabel}</span>
            {showPercent && <span className="font-mono">{percentage}%</span>}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // FULL CIRCLE VARIANT
  // ─────────────────────────────────────────────────────────────
  if (variant === 'circle') {
    const center = dim / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`flex flex-col items-center justify-center relative ${className}`}>
        <div className="relative" style={{ width: dim, height: dim }}>
          <svg width={dim} height={dim} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={trackColor}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
              style={{
                filter: `drop-shadow(0 0 4px ${colors.glow})`
              }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            <span className={`font-mono font-black tracking-tight leading-none ${colors.text}`} style={{ fontSize: dim * 0.26 }}>
              {safeScore}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">
              /{maxScore}
            </span>
            {tier && (
              <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.2 rounded mt-1 border ${colors.bg} ${colors.text} ${colors.border}`}>
                {tier}
              </span>
            )}
          </div>
        </div>

        {label && (
          <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 text-center font-mono">
            {label}
          </span>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 240-DEGREE SPEEDOMETER ARC & SEMI-CIRCLE VARIANT
  // ─────────────────────────────────────────────────────────────
  const isSemi = variant === 'semi-circle';
  const startAngle = isSemi ? 180 : 150;
  const endAngle = isSemi ? 360 : 390;
  const angleRange = endAngle - startAngle; // 180 or 240 deg

  const center = dim / 2;
  const radius = center - strokeWidth * 1.4;
  const arcLength = (angleRange / 360) * (2 * Math.PI * radius);
  const currentAngle = startAngle + (percentage / 100) * angleRange;
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  // Polar to Cartesian conversion
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const svgHeight = isSemi ? dim * 0.62 : dim * 0.9;
  const trackPath = describeArc(center, center, radius, startAngle, endAngle);

  // Indicator Needle Dot at current angle
  const dotPos = polarToCartesian(center, center, radius, currentAngle);

  return (
    <div 
      className={`flex flex-col items-center justify-center relative select-none ${interactive ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center" style={{ width: dim, height: svgHeight }}>
        <svg 
          width={dim} 
          height={svgHeight} 
          viewBox={`0 0 ${dim} ${svgHeight}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={`gauge-grad-${safeScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.8" />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity="1" />
            </linearGradient>
            <filter id={`glow-${safeScore}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={trackPath}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Progress Arc */}
          <path
            d={trackPath}
            fill="none"
            stroke={`url(#gauge-grad-${safeScore})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            filter={`url(#glow-${safeScore})`}
          />

          {/* Optional Ticks along arc */}
          {showTicks && [0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = startAngle + (tick / 100) * angleRange;
            const innerP = polarToCartesian(center, center, radius - strokeWidth * 0.8, tickAngle);
            const outerP = polarToCartesian(center, center, radius - strokeWidth * 1.3, tickAngle);
            return (
              <line
                key={tick}
                x1={innerP.x}
                y1={innerP.y}
                x2={outerP.x}
                y2={outerP.y}
                stroke={isDark ? '#475569' : '#cbd5e1'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Active Tip Indicator Dot */}
          <circle
            cx={dotPos.x}
            cy={dotPos.y}
            r={strokeWidth * 0.75}
            fill="#ffffff"
            stroke={colors.stroke}
            strokeWidth="2.5"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 4px ${colors.glow})`
            }}
          />
        </svg>

        {/* Center Score Display */}
        <div 
          className="absolute flex flex-col items-center justify-center text-center"
          style={{
            top: isSemi ? '45%' : '44%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex items-baseline justify-center">
            <span 
              className={`font-mono font-black tracking-tight leading-none ${colors.text}`}
              style={{ fontSize: dim * 0.24 }}
            >
              {safeScore}
            </span>
            <span 
              className="text-slate-400 font-mono font-bold ml-1"
              style={{ fontSize: Math.max(10, dim * 0.08) }}
            >
              /{maxScore}
            </span>
          </div>

          {tier && (
            <span 
              className={`font-mono uppercase font-bold px-2 py-0.5 rounded-full mt-1.5 border tracking-wider ${colors.bg} ${colors.text} ${colors.border}`}
              style={{ fontSize: Math.max(8, dim * 0.065) }}
            >
              {tier}
            </span>
          )}

          {sublabel && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
              {sublabel}
            </span>
          )}
        </div>

        {/* Min / Max Labels at the endpoints */}
        {showMinMax && (
          <div 
            className="absolute w-full px-3 flex justify-between text-[10px] font-mono text-slate-400"
            style={{ bottom: isSemi ? 0 : 2 }}
          >
            <span>{minScore}</span>
            <span>{maxScore}</span>
          </div>
        )}
      </div>

      {label && (
        <span className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200 text-center font-mono tracking-tight">
          {label}
        </span>
      )}
    </div>
  );
};
