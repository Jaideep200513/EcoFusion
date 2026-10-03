import React from 'react';
import type { DashboardTab } from '../../types';
import { Play, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: DashboardTab;
  onRunSimulation: () => void;
  isSimulating: boolean;
  onNavigateLanding?: () => void;
  onNavigateTab?: (tab: DashboardTab) => void;
}

const titles: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Dashboard', subtitle: 'A simple view of your cloud scheduling environment.' },
  workloads: { title: 'Workloads', subtitle: 'Add, review, and import the jobs you want to schedule.' },
  'resource-pools': { title: 'Resource Pools', subtitle: 'See the regions where workloads can run.' },
  'simulation-setup': { title: 'Simulation Setup', subtitle: 'Choose the workload size and scheduling method.' },
  scheduling: { title: 'Run Scheduler', subtitle: 'Find where and when each workload should run.' },
  experiments: { title: 'Experiments', subtitle: 'Run and review repeatable simulation experiments.' },
  results: { title: 'Results', subtitle: 'Understand energy, carbon, cost, and SLA results.' },
  comparisons: { title: 'Compare', subtitle: 'Compare EcoFusion with simpler scheduling methods.' },
  documentation: { title: 'Documentation', subtitle: 'Learn how the optimization model works.' },
  settings: { title: 'Settings', subtitle: 'Configure framework options and thresholds.' },
  configuration: { title: 'Settings', subtitle: 'Configure framework options and thresholds.' },
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onRunSimulation, isSimulating }) => {
  const meta = titles[activeTab] || titles.overview;
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-5 md:px-8 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-950">{meta.title}</h1>
        <p className="text-sm text-slate-500 mt-0.5 truncate">{meta.subtitle}</p>
      </div>
      <button
        onClick={onRunSimulation}
        disabled={isSimulating}
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
        <span className="hidden sm:inline">{isSimulating ? 'Running…' : 'Run simulation'}</span>
        <span className="sm:hidden">Run</span>
      </button>
    </header>
  );
};

export default Header;
