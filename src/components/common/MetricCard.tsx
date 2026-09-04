import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean; // true = good, false = warning
    label?: string;
  };
  accentColor?: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';
  isDemo?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  unit,
  icon,
  trend,
  accentColor = 'cyan',
  isDemo = true,
}) => {
  const getAccentBorder = () => {
    switch (accentColor) {
      case 'emerald':
        return 'hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'violet':
        return 'hover:border-violet-500/40 text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'amber':
        return 'hover:border-amber-500/40 text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'rose':
        return 'hover:border-rose-500/40 text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'hover:border-cyan-500/40 text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    }
  };

  return (
    <div className="glass-panel p-5 rounded-xl glass-panel-hover flex flex-col justify-between relative overflow-hidden group">
      {/* Background ambient glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-slate-800/40 group-hover:bg-cyan-900/20 transition-all blur-xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-2.5 rounded-lg border ${getAccentBorder()}`}>
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-100 tracking-tight">
            {value}
          </span>
          {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        {trend ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {trend.value}
            </span>
            <span className="text-slate-400">{trend.label || 'vs baseline'}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">{subtitle || 'Simulation state'}</span>
        )}

        {isDemo && (
          <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
            DEMO
          </span>
        )}
      </div>
    </div>
  );
};
