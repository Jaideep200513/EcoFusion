import React from 'react';
import { MetricCard } from '../components/common/MetricCard';
import { ChartCard } from '../components/common/ChartCard';
import { simulatorService } from '../services/simulatorService';
import { demoCarbonTimeSeries, demoParetoPoints } from '../data/mockData';
import {
  Server,
  Building2,
  Zap,
  Leaf,
  DollarSign,
  AlertOctagon,
  Play,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
  onRunSimulation: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab, onRunSimulation }) => {
  const workloads = simulatorService.getWorkloads();
  const datacenters = simulatorService.getDataCenters();

  const totalWorkloads = workloads.length;
  const activeDcs = datacenters.filter((d) => d.status === 'ONLINE').length;
  const totalEnergyKwh = 3410; // Demo simulation value
  const totalCarbonKg = 980; // Demo simulation value
  const totalCostUsd = 462; // Demo simulation value
  const slaViolationRate = 1.2; // Demo simulation value

  const workloadDistData = datacenters.map((dc) => ({
    name: dc.id,
    region: dc.region.split(' ')[0],
    count: dc.activeWorkloadsCount,
    utilization: dc.currentUtilization,
  }));

  const pieSlaData = [
    { name: 'SLA Compliant', value: 22, color: '#10b981' },
    { name: 'SLA Risk', value: 2, color: '#f59e0b' },
    { name: 'SLA Violated', value: 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-100">
              Demo Simulation Environment
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              PROTOTYPE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulating spatial-temporal scheduling across 3 multi-region cloud data centers.
            Evaluates workload placement choices (WHERE) and execution delays (WHEN) against grid carbon intensity and electricity prices.
          </p>
        </div>

        <button
          onClick={onRunSimulation}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 hover:from-cyan-400 hover:to-emerald-400 glow-cyan transition-all active:scale-95 shrink-0"
        >
          <Play className="w-4 h-4 fill-current text-slate-950" />
          <span>Execute Demo Simulation</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Workloads"
          value={totalWorkloads}
          unit="tasks"
          icon={<Server className="w-5 h-5 text-cyan-400" />}
          subtitle="24h horizon sample"
          accentColor="cyan"
        />
        <MetricCard
          title="Active Data Centers"
          value={activeDcs}
          unit="nodes"
          icon={<Building2 className="w-5 h-5 text-emerald-400" />}
          subtitle="3 global regions"
          accentColor="emerald"
        />
        <MetricCard
          title="Total Energy"
          value={totalEnergyKwh.toLocaleString()}
          unit="kWh"
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          trend={{ value: '-19.2%', isPositive: true, label: 'vs Random' }}
          accentColor="amber"
        />
        <MetricCard
          title="Carbon Emissions"
          value={totalCarbonKg.toLocaleString()}
          unit="kgCO₂"
          icon={<Leaf className="w-5 h-5 text-emerald-400" />}
          trend={{ value: '-49.6%', isPositive: true, label: 'vs Baseline' }}
          accentColor="emerald"
        />
        <MetricCard
          title="Operational Cost"
          value={`$${totalCostUsd}`}
          unit="USD"
          icon={<DollarSign className="w-5 h-5 text-cyan-400" />}
          trend={{ value: '-36.5%', isPositive: true, label: 'vs Peak' }}
          accentColor="cyan"
        />
        <MetricCard
          title="SLA Violation Rate"
          value={`${slaViolationRate}%`}
          icon={<AlertOctagon className="w-5 h-5 text-violet-400" />}
          trend={{ value: '1.2%', isPositive: true, label: 'Target <5%' }}
          accentColor="violet"
        />
      </div>

      {/* Row 2: Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon & Energy over time */}
        <ChartCard
          title="Grid Carbon Intensity & IT Energy Load Over Time"
          subtitle="Dynamic 24-hour time slot forecast across regions (Demo values)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoCarbonTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDc1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDc2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="dc1Carbon"
                name="DC1 (US East) gCO₂/kWh"
                stroke="#06b6d4"
                fillOpacity={1}
                fill="url(#colorDc1)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="dc2Carbon"
                name="DC2 (EU Central) gCO₂/kWh"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorDc2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Carbon vs Cost Trade-off scatter */}
        <ChartCard
          title="Carbon vs Cost Pareto Trade-Off Preview"
          subtitle="Multi-objective solution frontier (Illustrative Pareto Front — Demo)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                dataKey="costUsd"
                name="Cost"
                unit="$"
                stroke="#64748b"
                fontSize={11}
                domain={[25, 80]}
              />
              <YAxis
                type="number"
                dataKey="carbonKg"
                name="Carbon"
                unit="kg"
                stroke="#64748b"
                fontSize={11}
                domain={[80, 160]}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Candidate Solutions" data={demoParetoPoints} fill="#06b6d4">
                {demoParetoPoints.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.selected ? '#10b981' : entry.id === 5 ? '#f59e0b' : '#06b6d4'}
                    stroke={entry.selected ? '#34d399' : '#0284c7'}
                    strokeWidth={entry.selected ? 3 : 1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Distribution & SLA Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload Distribution across DCs */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Workload Distribution Across Data Centers"
            subtitle="Active assigned workloads & PUE metrics per facility"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Assigned Workloads" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="utilization" name="CPU Utilization %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* SLA Compliance Breakdown */}
        <ChartCard
          title="SLA Compliance Status"
          subtitle="Workload completion deadlines feasibility"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieSlaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieSlaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>91.6% Compliant in Demo Mode</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Navigation Quick Link to Core Scheduling */}
      <div className="glass-panel p-5 rounded-xl border border-cyan-950/60 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Ready to explore spatial-temporal decision matrix?</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              WHERE + WHEN
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Test candidate Data Center × Time Slot combinations for individual workloads.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('scheduling')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>Open Scheduling Workspace</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
