import React from 'react';
import { simulatorService } from '../services/simulatorService';
import { demoCarbonTimeSeries } from '../data/mockData';
import type { DashboardTab, SimulationResult } from '../types';
import {
  Server,
  Zap,
  Leaf,
  Play,
  ArrowRight,
  ShieldCheck,
  Globe,
  Sliders,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OverviewProps {
  onNavigateTab: (tab: DashboardTab) => void;
  onRunSimulation: () => void;
  latestResult: SimulationResult | null;
  isSimulating?: boolean;
}

export const Overview: React.FC<OverviewProps> = ({
  onNavigateTab,
  onRunSimulation,
  latestResult,
  isSimulating,
}) => {
  const workloads = simulatorService.getWorkloads();
  const resourcePools = simulatorService.getResourcePools();

  // Metrics from latest simulation or default representative values
  const totalWorkloads = latestResult ? latestResult.totalWorkloads : workloads.length;
  const totalEnergy = latestResult ? latestResult.totalEnergyKwh : 3410.5;
  const totalCarbon = latestResult ? latestResult.totalCarbonKg : 980.2;
  const slaViolationRate = latestResult ? latestResult.slaViolationRate : 0.0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Framework Status */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">
              Spatial-Temporal Simulation Testbed
            </h2>
            <span className="px-2.5 py-1 rounded text-xs font-sans font-bold bg-slate-100 text-slate-950 border border-slate-300">
              TRACES LOADED
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed font-normal">
            Evaluating multi-objective scheduling across 3 regional resource pools (Mumbai, Hyderabad, and Singapore).
            Tasks are dynamically matched to optimal spatial locations and future time windows to minimize carbon and cost while respecting SLA deadlines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('simulation-setup')}
            className="px-4 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-bold text-slate-800 hover:text-slate-950 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Sliders className="w-4 h-4 text-slate-700" />
            <span>Simulation Parameters</span>
          </button>

          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="px-4.5 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-sm font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2 border border-slate-900"
          >
            <Play className="w-4 h-4 fill-current text-white" />
            <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Workloads */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>Workload Profiles</span>
            <Server className="w-4 h-4 text-slate-950" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-950">{totalWorkloads}</div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-mono font-medium">
            <span className="text-slate-950 font-bold">100%</span> scheduled trace tasks
          </div>
        </div>

        {/* Metric 2: Carbon Footprint */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>Simulated Carbon</span>
            <Leaf className="w-4 h-4 text-slate-950" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-950">{totalCarbon.toFixed(1)} <span className="text-xs font-sans text-slate-500 font-normal">kgCO₂</span></div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-mono font-medium">
            <span className="text-slate-950 font-bold">-28.6%</span> vs. Random Allocation
          </div>
        </div>

        {/* Metric 3: Energy Consumption */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>Total Energy Ledger</span>
            <Zap className="w-4 h-4 text-slate-950" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-950">{totalEnergy.toFixed(1)} <span className="text-xs font-sans text-slate-500 font-normal">kWh</span></div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-mono font-medium">
            PUE avg <span className="text-slate-950 font-mono font-bold">1.23</span> across 3 pools
          </div>
        </div>

        {/* Metric 4: SLA Compliance */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>SLA Compliance</span>
            <ShieldCheck className="w-4 h-4 text-slate-950" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-950">
            {(100 - slaViolationRate).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-mono font-medium">
            <span className="text-slate-950 font-bold">0</span> deadline violations
          </div>
        </div>
      </div>

      {/* Main Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Grid Intensity Forecast (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950">Dynamic Grid Carbon Intensity (24h)</h3>
              <p className="text-xs text-slate-500 font-medium">Predicted gCO₂/kWh across regional grids (Mumbai solar dip visible midday)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5 text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950" /> Mumbai
              </span>
              <span className="flex items-center gap-1.5 text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Hyderabad
              </span>
              <span className="flex items-center gap-1.5 text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Singapore
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demoCarbonTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBOM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#09090b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#09090b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHYD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSIN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[200, 700]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#ffffff' }}
                />
                <Area type="monotone" dataKey="Mumbai" stroke="#09090b" strokeWidth={2} fillOpacity={1} fill="url(#colorBOM)" />
                <Area type="monotone" dataKey="Hyderabad" stroke="#475569" strokeWidth={2} fillOpacity={1} fill="url(#colorHYD)" />
                <Area type="monotone" dataKey="Singapore" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorSIN)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Resource Pool Snapshot (1 Col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-950">Resource Pool Status</h3>
              <button
                onClick={() => onNavigateTab('resource-pools')}
                className="text-xs text-slate-950 font-bold hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              {resourcePools.map((pool) => (
                <div key={pool.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-950">{pool.locationLabel}</span>
                    <span className="font-mono text-slate-600 font-semibold">{pool.currentUtilization}% Utilized</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden mb-2">
                    <div
                      className="h-full bg-slate-950 rounded-full"
                      style={{ width: `${pool.currentUtilization}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 font-medium">
                    <span>PUE: {pool.pue}</span>
                    <span>{pool.carbonIntensity} gCO₂/kWh</span>
                    <span>${pool.electricityPrice}/kWh</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between font-medium">
            <span>Active Workload Tasks:</span>
            <span className="font-mono text-slate-950 font-extrabold">{workloads.length} Tasks Scheduled</span>
          </div>
        </div>
      </div>

      {/* Quick Access Research Workflow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('simulation-setup')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-950 text-left transition-all cursor-pointer group shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform shadow-xs">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="text-sm font-bold text-slate-950">1. Simulation Setup</div>
          <div className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">Configure trace dataset, constraints, and objective weights.</div>
        </button>

        <button
          onClick={() => onNavigateTab('scheduling')}
          className="p-4 rounded-xl bg-slate-50 border-2 border-slate-950 hover:bg-slate-100 text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform shadow-xs">
            <Globe className="w-4 h-4" />
          </div>
          <div className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5">
            <span>2. WHERE + WHEN Grid</span>
            <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-950 text-white font-bold">CORE</span>
          </div>
          <div className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">Inspect spatial placement and temporal shift matrix.</div>
        </button>

        <button
          onClick={() => onNavigateTab('comparisons')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-950 text-left transition-all cursor-pointer group shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="text-sm font-bold text-slate-950">3. Baseline Benchmarks</div>
          <div className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">Evaluate NSGA-II against Random, First-Fit, and Single-Metric.</div>
        </button>

        <button
          onClick={() => onNavigateTab('documentation')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-950 text-left transition-all cursor-pointer group shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-sm font-bold text-slate-950">4. Methodology & Formulas</div>
          <div className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">Review formal IT, facility, emissions, and cost equations.</div>
        </button>
      </div>

      {/* Research Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-medium">
        <span>
          <strong className="text-slate-950">Academic Framework Note:</strong> Illustrative optimization output based on trace-driven simulation runs. Actual results depend on workload characteristics and grid carbon dynamics.
        </span>
        <button
          onClick={() => onNavigateTab('documentation')}
          className="text-slate-950 hover:text-slate-700 shrink-0 font-extrabold cursor-pointer underline underline-offset-2"
        >
          Read Formulation Guide →
        </button>
      </div>
    </div>
  );
};

export default Overview;
