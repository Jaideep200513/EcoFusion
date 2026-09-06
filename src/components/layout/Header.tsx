import React from 'react';
import type { DashboardTab } from '../../types';
import { Play, RefreshCw, Globe, ArrowLeft, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: DashboardTab;
  onRunSimulation: () => void;
  isSimulating: boolean;
  onNavigateLanding?: () => void;
  onNavigateTab?: (tab: DashboardTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onRunSimulation,
  isSimulating,
  onNavigateLanding,
  onNavigateTab,
}) => {
  const getPageMeta = (): { title: string; subtitle: string; group: string } => {
    switch (activeTab) {
      case 'overview':
        return {
          group: 'OVERVIEW',
          title: 'Research Dashboard Overview',
          subtitle: 'High-level telemetry across regional resource pools, active workloads, and simulation ledgers',
        };
      case 'workloads':
        return {
          group: 'WORKSPACE',
          title: 'Workload Dataset & Traces',
          subtitle: 'Profile CPU/memory footprints, arrival timestamps, and hard SLA completion deadlines',
        };
      case 'resource-pools':
        return {
          group: 'WORKSPACE',
          title: 'Regional Resource Pools',
          subtitle: 'Abstract multi-cloud regions (Mumbai, Hyderabad, Singapore) with dynamic PUE and grid emissions',
        };
      case 'simulation-setup':
        return {
          group: 'WORKSPACE',
          title: 'Simulation Parameter Setup',
          subtitle: 'Configure trace parameters, infrastructure limits, objective weights, and algorithmic baselines',
        };
      case 'scheduling':
        return {
          group: 'WORKSPACE',
          title: 'Spatial-Temporal Scheduling (WHERE + WHEN)',
          subtitle: 'Candidate decision matrix (Resource Pool × Time Slot) and Pareto-optimal assignments',
        };
      case 'experiments':
        return {
          group: 'RESEARCH',
          title: 'Experiment Runs & Archives',
          subtitle: 'Reproducible simulation records with configurable random seeds and parameter snapshots',
        };
      case 'results':
        return {
          group: 'RESEARCH',
          title: 'Optimization Results Ledger',
          subtitle: 'Empirical ledger tracking E_IT, E_DC, carbon emissions, electricity costs, and SLA adherence',
        };
      case 'comparisons':
        return {
          group: 'RESEARCH',
          title: 'Algorithm Baseline Benchmarking',
          subtitle: 'Evaluating NSGA-II against Random, First-Fit, Energy-Aware, and Carbon-Aware heuristics',
        };
      case 'documentation':
        return {
          group: 'REFERENCE',
          title: 'Mathematical Formulation & Methodology',
          subtitle: 'Formal system equations, multi-objective trade-offs, and constraint enforcement rules',
        };
      case 'settings':
      case 'configuration':
        return {
          group: 'REFERENCE',
          title: 'Framework Settings & Constants',
          subtitle: 'Objective weights, SLA violation thresholds, and export formatting parameters',
        };
      default:
        return {
          group: 'WORKSPACE',
          title: 'EcoFusion Platform',
          subtitle: 'Spatial-Temporal Cloud Workload Scheduling Framework',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans uppercase tracking-wider text-slate-500 font-extrabold">
            {meta.group} /
          </span>
          <h2 className="text-lg font-extrabold text-slate-950 tracking-tight">{meta.title}</h2>
          <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-sans rounded font-bold bg-slate-100 text-slate-900 border border-slate-300">
            RESEARCH PROTOTYPE
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1 font-medium">{meta.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Regional Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold">
          <Globe className="w-4 h-4 text-slate-950" />
          <span className="font-sans text-xs font-bold">3 Regions Active</span>
        </div>

        {/* Documentation Quick Link */}
        {onNavigateTab && activeTab !== 'documentation' && (
          <button
            onClick={() => onNavigateTab('documentation')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-black bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>Formulas</span>
          </button>
        )}

        {/* Switch to Landing Page Button */}
        {onNavigateLanding && (
          <button
            onClick={onNavigateLanding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-950 hover:bg-slate-100 bg-white border border-slate-300 transition-all cursor-pointer shadow-xs"
            title="Return to Public Landing Page"
          >
            <ArrowLeft className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">Landing</span>
          </button>
        )}

        {/* Run Simulation CTA */}
        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-extrabold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-sm cursor-pointer border border-slate-900 ${
            isSimulating ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
          }`}
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
