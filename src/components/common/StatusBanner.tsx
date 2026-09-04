import React from 'react';
import type { SystemStatus } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Database, Cpu, GitMerge, PlayCircle } from 'lucide-react';

interface StatusBannerProps {
  status: SystemStatus;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ status }) => {
  return (
    <div className="glass-panel p-4 rounded-xl border border-cyan-900/40 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/20 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <PlayCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Prototype Environment — Week 3 Methodology
              </h4>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 font-mono">
                {status.simulationMode} MODE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulator baseline active. Datasets, ML workload forecasting, and NSGA-II solver scheduled for Week 4 integration.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            type="dataset"
            label={`Dataset: ${status.datasetStatus.replace('_', ' ')}`}
            status="warning"
            icon={<Database className="w-3.5 h-3.5" />}
          />
          <StatusBadge
            type="mlModel"
            label={`ML Model: ${status.mlModelStatus.replace('_', ' ')}`}
            status="neutral"
            icon={<Cpu className="w-3.5 h-3.5" />}
          />
          <StatusBadge
            type="nsga2"
            label={`NSGA-II: ${status.nsga2Status.replace('_', ' ')}`}
            status="neutral"
            icon={<GitMerge className="w-3.5 h-3.5" />}
          />
          <StatusBadge
            type="simulation"
            label={`Sim Engine: ${status.simulationMode}`}
            status="info"
            icon={<PlayCircle className="w-3.5 h-3.5" />}
          />
        </div>
      </div>
    </div>
  );
};
