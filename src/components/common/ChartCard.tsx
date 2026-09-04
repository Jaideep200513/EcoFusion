import React from 'react';
import { Info } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  demoLabel?: string;
  height?: number | string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  action,
  demoLabel = 'Illustrative — Demo Data',
  height = 300,
}) => {
  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            {demoLabel && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {demoLabel}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div style={{ height: typeof height === 'number' ? `${height}px` : height }} className="w-full">
        {children}
      </div>
    </div>
  );
};
