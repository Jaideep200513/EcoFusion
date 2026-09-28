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
  demoLabel,
  height = 300,
}) => {
  return (
    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-950 tracking-tight">{title}</h3>
            {demoLabel && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                {demoLabel}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-slate-400" />
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
