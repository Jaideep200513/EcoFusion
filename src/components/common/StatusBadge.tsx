import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';

interface StatusBadgeProps {
  type: 'dataset' | 'mlModel' | 'nsga2' | 'simulation' | 'sla' | 'custom';
  label: string;
  status?: 'success' | 'warning' | 'info' | 'neutral' | 'error';
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status = 'neutral',
  icon,
  size = 'md',
}) => {
  const getColors = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60 glow-emerald';
      case 'warning':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'error':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      case 'info':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60 glow-cyan';
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700/80';
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'info':
        return <Info className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full backdrop-blur-sm transition-all ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${getColors()}`}
    >
      {getIcon()}
      <span>{label}</span>
    </span>
  );
};
