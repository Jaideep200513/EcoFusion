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
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  unit,
  icon,
  trend,
  accentColor = 'cyan',
  badge,
}) => {
  const getAccentBorder = () => {
    switch (accentColor) {
      case 'emerald':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'violet':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'amber':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'rose':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-900 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
            {title}
          </span>
          <div className={`p-2.5 rounded-lg border ${getAccentBorder()}`}>
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-950 font-mono tracking-tight">
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-500 font-sans">{unit}</span>}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        {trend ? (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span
              className={`font-bold ${
                trend.isPositive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {trend.value}
            </span>
            <span className="text-slate-500 font-sans font-medium">{trend.label || 'vs baseline'}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-medium">{subtitle || 'Active state'}</span>
        )}

        {badge && (
          <span className="text-[10px] font-mono text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded font-semibold border border-slate-200">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
