import React from 'react';
import type { ActiveTab } from './Sidebar';
import { Play, RefreshCw, Cpu, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onRunSimulation: () => void;
  isSimulating: boolean;
  lastSimTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onRunSimulation,
  isSimulating,
  lastSimTime,
}) => {
  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Simulation Overview',
          subtitle: 'Real-time multi-data-center energy, carbon, and SLA status monitoring',
        };
      case 'workloads':
        return {
          title: 'Workload Management',
          subtitle: 'Track CPU/Memory demands, arrival times, deadlines, and SLA statuses',
        };
      case 'datacenters':
        return {
          title: 'Data Center Management',
          subtitle: 'Monitor PUE, capacity, utilization, and dynamic grid carbon intensity',
        };
      case 'carbon-energy':
        return {
          title: 'Sustainability Analytics',
          subtitle: 'Carbon emissions, energy consumption, and electricity pricing trends',
        };
      case 'scheduling':
        return {
          title: 'Spatial-Temporal Scheduling (WHERE + WHEN)',
          subtitle: 'Multi-objective candidate option matrix and Pareto trade-off optimization',
        };
      case 'experiments':
        return {
          title: 'Experiment Management',
          subtitle: 'Configure parameters, set random seeds, and manage simulation runs',
        };
      case 'results':
        return {
          title: 'Results Analysis',
          subtitle: 'Comparative benchmark of baseline algorithms vs EcoFusion multi-objective',
        };
      case 'settings':
        return {
          title: 'System Settings & Config',
          subtitle: 'Simulator default weights, constraint limits, and export parameters',
        };
      default:
        return { title: 'EcoFusion Dashboard', subtitle: 'Cloud Data Center Sustainability Framework' };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="glass-panel border-b border-slate-800/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 bg-slate-950/80">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">{meta.title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {lastSimTime && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Last Sim: {lastSimTime}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-xs border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-mono">EXP-2026-001</span>
        </div>

        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
            isSimulating
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:from-cyan-400 hover:to-emerald-400 glow-cyan active:scale-95'
          }`}
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-slate-950" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
