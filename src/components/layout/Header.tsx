import React from 'react';
import type { DashboardTab } from '../../types';

interface HeaderProps {
  activeTab: DashboardTab;
  onRunSimulation?: () => void;
  isSimulating?: boolean;
  onNavigateLanding?: () => void;
  onNavigateTab?: (tab: DashboardTab) => void;
  onOpenWalkthrough?: () => void;
}

const titles: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Dashboard', subtitle: 'Overview of your cloud scheduling environment and key metrics.' },
  workloads: { title: 'Workloads', subtitle: 'Load a preset cloud trace, import Excel, or add jobs manually.' },
  'resource-pools': { title: 'Resource Pools', subtitle: 'Regional data centers in Mumbai, Hyderabad, and Singapore.' },
  'simulation-setup': { title: 'Simulation Setup', subtitle: 'Configure scheduling strategy and objective weights.' },
  scheduling: { title: 'Run Scheduler', subtitle: 'Execute optimization and inspect workload placement.' },
  experiments: { title: 'Experiments', subtitle: 'Run and review repeatable simulation experiments.' },
  results: { title: 'Results', subtitle: 'Detailed carbon, energy, cost, SLA, and Pareto front results.' },
  comparisons: { title: 'Compare Models', subtitle: 'Benchmark all 7 scheduling algorithms side by side.' },
  documentation: { title: 'Documentation', subtitle: 'Learn how the optimization model works.' },
  settings: { title: 'Settings', subtitle: 'Configure framework options and thresholds.' },
  configuration: { title: 'Settings', subtitle: 'Configure framework options and thresholds.' },
};

const steps: { id: DashboardTab; label: string }[] = [
  { id: 'overview', label: '1. Dashboard' },
  { id: 'workloads', label: '2. Workloads' },
  { id: 'resource-pools', label: '3. Pools' },
  { id: 'simulation-setup', label: '4. Setup' },
  { id: 'scheduling', label: '5. Run' },
  { id: 'results', label: '6. Results' },
  { id: 'comparisons', label: '7. Compare' },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigateTab, onOpenWalkthrough }) => {
  const meta = titles[activeTab] || titles.overview;
  const activeStepIdx = steps.findIndex((s) => s.id === activeTab);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-5 md:px-8 py-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-950">{meta.title}</h1>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{meta.subtitle}</p>
      </div>

      <div className="flex items-center justify-between xl:justify-end gap-3">
        {/* Clean Step Indicator Pills */}
        {onNavigateTab && activeStepIdx !== -1 && (
          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/70">
            {steps.map((step, idx) => {
              const isCurrent = step.id === activeTab;
              const isPast = idx < activeStepIdx;
              return (
                <button
                  key={step.id}
                  onClick={() => onNavigateTab(step.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-950 text-white shadow-2xs'
                      : isPast
                      ? 'text-emerald-700 hover:bg-white/60'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        )}

        {onOpenWalkthrough && (
          <button
            onClick={onOpenWalkthrough}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Open Interactive Walkthrough"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Guided Tour</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
