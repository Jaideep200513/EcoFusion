import React from 'react';
import type { SystemStatus } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Database, Cpu, GitMerge, PlayCircle } from 'lucide-react';

interface StatusBannerProps {
  status: SystemStatus;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ status }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900">
            <PlayCircle className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
                EcoFusion Spatial-Temporal Optimization Framework
              </h4>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-900 rounded border border-slate-300 font-mono">
                {status.simulationMode}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Multi-objective NSGA-II spatial routing & discrete time slot scheduler active.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            type="dataset"
            label={`Dataset: ${status.datasetStatus.replace('_', ' ')}`}
            status="success"
            icon={<Database className="w-3.5 h-3.5" />}
          />
          <StatusBadge
            type="mlModel"
            label={`ML Model: ${status.mlModelStatus.replace('_', ' ')}`}
            status="info"
            icon={<Cpu className="w-3.5 h-3.5" />}
          />
          <StatusBadge
            type="nsga2"
            label={`NSGA-II: ${status.nsga2Status.replace('_', ' ')}`}
            status="success"
            icon={<GitMerge className="w-3.5 h-3.5" />}
          />
          <StatusBadge
            type="simulation"
            label={`Engine: ${status.simulationMode}`}
            status="neutral"
            icon={<PlayCircle className="w-3.5 h-3.5" />}
          />
        </div>
      </div>
    </div>
  );
};
