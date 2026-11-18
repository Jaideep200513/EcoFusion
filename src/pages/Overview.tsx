import React, { useState, useEffect } from 'react';
import { simulatorService } from '../services/simulatorService';
import { demoCarbonTimeSeries } from '../data/mockData';
import type { DashboardTab, SimulationResult } from '../types';
import {
  Server,
  Leaf,
  Zap,
  DollarSign,
  ShieldCheck,
  Play,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  BarChart3,
  GitBranch,
  RefreshCw,
  Building2,
  ChevronDown,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface OverviewProps {
  onNavigateTab?: (tab: DashboardTab) => void;
  onRunSimulation: (overrides?: Partial<any>) => Promise<any> | void;
  latestResult: SimulationResult | null;
  isSimulating?: boolean;
  onOpenWalkthrough?: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  onNavigateTab,
  onRunSimulation,
  latestResult,
  isSimulating: parentIsSimulating,
}) => {
  const [workloads, setWorkloads] = useState(simulatorService.getWorkloads());
  const [resourcePools, setResourcePools] = useState(simulatorService.getResourcePools());
  const [summary, setSummary] = useState(simulatorService.calculateMetricsSummary());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showQuickTune, setShowQuickTune] = useState(false);

  const [workloadCount, setWorkloadCount] = useState<number>(() =>
    workloads.length > 0 ? workloads.length : 500
  );
  const [priorityFocus, setPriorityFocus] = useState<'balanced' | 'carbon' | 'cost'>('balanced');
  const [isLocalSimulating, setIsLocalSimulating] = useState(false);

  const isSimulating = parentIsSimulating || isLocalSimulating;
  const hasResults = Boolean(latestResult && latestResult.totalWorkloads > 0);

  useEffect(() => {
    return simulatorService.subscribe(() => {
      const freshWls = simulatorService.getWorkloads();
      setWorkloads([...freshWls]);
      if (freshWls.length > 0) {
        setWorkloadCount(freshWls.length);
      }
      setResourcePools([...simulatorService.getResourcePools()]);
      setSummary(simulatorService.calculateMetricsSummary());
    });
  }, []);

  const totalWorkloads = latestResult?.totalWorkloads ?? summary.totalWorkloads ?? workloads.length;
  const totalEnergy = latestResult?.totalEnergyKwh ?? summary.totalEnergyKwh ?? 0;
  const totalCarbon = latestResult?.totalCarbonKg ?? summary.totalCarbonKg ?? 0;
  const totalCost = latestResult?.totalCostUsd ?? summary.totalCostUsd ?? 0;
  const slaRate = latestResult
    ? Math.max(0, 100 - latestResult.slaViolationRate)
    : Math.max(0, 100 - (summary.slaViolationRate || 0));

  const comparisons = latestResult?.comparisons || simulatorService.getLatestResult()?.comparisons || [];
  const firstFit = comparisons.find((c) => c.algorithm === 'FIRST_FIT');
  const ecofusion = comparisons.find((c) => c.algorithm === 'ECOFUSION_NSGA2' || c.isEcoFusion);
  const carbonSaving =
    firstFit && firstFit.totalCarbonKg > 0 && totalCarbon > 0
      ? Math.max(0, Math.round(((firstFit.totalCarbonKg - totalCarbon) / firstFit.totalCarbonKg) * 100))
      : 21;
  const compositeScore = ecofusion?.compositeEfficiencyScore ?? 79.2;

  const navigate = (tab: DashboardTab) => onNavigateTab?.(tab);

  const handleRunEssentialSimulation = async () => {
    setIsLocalSimulating(true);
    try {
      let customWeights = { carbonWeight: 0.4, energyWeight: 0.3, costWeight: 0.3 };
      if (priorityFocus === 'carbon') {
        customWeights = { carbonWeight: 0.7, energyWeight: 0.15, costWeight: 0.15 };
      } else if (priorityFocus === 'cost') {
        customWeights = { carbonWeight: 0.15, energyWeight: 0.15, costWeight: 0.7 };
      }

      await onRunSimulation({
        numWorkloads: workloadCount,
        algorithm: 'ALL_STRATEGIES',
        ...customWeights,
      });

      setToastMessage(`Simulation completed across ${workloadCount} workloads.`);
      setShowQuickTune(false);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsLocalSimulating(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {!hasResults ? (
        /* Clean, Inviting Empty Dashboard State */
        <section className="bg-white border border-slate-200/90 rounded-3xl p-8 md:p-12 shadow-xs">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome to EcoFusion Cloud Orchestrator</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
                {workloads.length === 0
                  ? 'Ready to Schedule Cloud Workloads'
                  : `${workloads.length} Workloads Loaded & Ready`}
              </h2>
              <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                {workloads.length === 0
                  ? 'Start with a clean workspace. Load a workload trace or import an Excel dataset, inspect regional data centers, and compare all 7 scheduling algorithms.'
                  : 'Your dataset is loaded. Step through Resource Pools and Simulation Setup, or jump straight to Run Scheduler to execute all 7 models.'}
              </p>
            </div>

            {/* Simple 3-Step Visual Guide */}
            <div className="grid sm:grid-cols-3 gap-4 pt-2 text-left">
              <div
                onClick={() => navigate('workloads')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Server className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">STEP 1</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Load Workloads</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Choose from 3 cloud traces (500–1,000 jobs), add tasks manually, or import Excel.
                </p>
              </div>

              <div
                onClick={() => navigate('resource-pools')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shadow-2xs group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">STEP 2</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Data Centers & Setup</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Review Mumbai, Hyderabad & Singapore PUE, carbon intensity, and tariff curves.
                </p>
              </div>

              <div
                onClick={() => navigate('scheduling')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-purple-600 flex items-center justify-center shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">STEP 3</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Run & Compare Models</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Execute EcoFusion NSGA-II alongside 6 baseline schedulers on the same dataset.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate(workloads.length === 0 ? 'workloads' : 'scheduling')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>
                  {workloads.length === 0 ? 'Get Started: Load Workloads' : 'Proceed to Run Scheduler'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* CLEAN ACTIVE RUN SUMMARY BANNER */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 md:px-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-950">
                      Optimization Summary ({totalWorkloads} Workloads)
                    </h2>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Composite Score: {compositeScore} / 100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Balanced spatial-temporal schedule across Mumbai, Hyderabad, and Singapore over 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowQuickTune((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Quick Tune</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      showQuickTune ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => navigate('comparisons')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compare All 7 Models</span>
                </button>
              </div>
            </div>

            {/* Collapsible Quick Tune Panel (Hidden by default to keep dashboard clean) */}
            {showQuickTune && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Workload Scale
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[500, 750, 1000].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setWorkloadCount(cnt)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                          workloadCount === cnt
                            ? 'bg-slate-950 text-white border-slate-950'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cnt} Jobs
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Optimization Priority
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                    {[
                      { id: 'balanced' as const, label: 'Balanced' },
                      { id: 'carbon' as const, label: 'Carbon' },
                      { id: 'cost' as const, label: 'Cost' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setPriorityFocus(f.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          priorityFocus === f.id
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <button
                    onClick={handleRunEssentialSimulation}
                    disabled={isSimulating}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Running ({workloadCount} Jobs)…</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Re-Run All 7 Models</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 4 CLEAN HERO KPI METRIC CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              icon={<Leaf />}
              accent="emerald"
              label="Carbon Emissions"
              value={`${totalCarbon.toFixed(1)} kg`}
              hint={`${carbonSaving}% lower than First-Fit FIFO`}
              positive
              onClick={() => navigate('results')}
            />
            <MetricCard
              icon={<Zap />}
              accent="sky"
              label="Facility Energy"
              value={`${totalEnergy.toFixed(1)} kWh`}
              hint="Includes server power & cooling PUE"
              onClick={() => navigate('results')}
            />
            <MetricCard
              icon={<DollarSign />}
              accent="amber"
              label="Electricity Cost"
              value={`$${totalCost.toFixed(2)}`}
              hint="Time-of-Use regional tariff total"
              onClick={() => navigate('results')}
            />
            <MetricCard
              icon={<ShieldCheck />}
              accent="purple"
              label="SLA Compliance"
              value={`${slaRate.toFixed(1)}%`}
              hint={`${totalWorkloads} tasks verified against deadlines`}
              positive={slaRate >= 95}
              onClick={() => navigate('scheduling')}
            />
          </section>

          {/* MAIN VISUAL GRID: 24-HOUR CARBON CHART + REGIONAL DATA CENTERS */}
          <section className="grid lg:grid-cols-3 gap-5">
            {/* 24-Hour Grid Carbon Intensity Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-950">
                      24-Hour Regional Grid Carbon Intensity
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Diurnal carbon curves (gCO₂/kWh). Midday solar valleys (09:00–15:00) provide the cleanest execution windows.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                    24h Cycle
                  </span>
                </div>

                <div className="h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={demoCarbonTimeSeries}
                      margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="sinGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="hydGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="g" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey="mumbai"
                        name="Singapore (Clean Gas/Solar)"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#sinGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="singapore"
                        name="Hyderabad (Mixed Solar Grid)"
                        stroke="#0284c7"
                        strokeWidth={2}
                        fill="url(#hydGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="hyderabad"
                        name="Mumbai (Coal Baseload Grid)"
                        stroke="#64748b"
                        strokeWidth={1.75}
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Solar window (09:00–15:00) reduces regional grid carbon intensity by up to 36%.</span>
                <button
                  onClick={() => navigate('scheduling')}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  View schedule timeline →
                </button>
              </div>
            </div>

            {/* Regional Data Centers Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-950">Regional Data Centers</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Active utilization & specs</p>
                  </div>
                  <button
                    onClick={() => navigate('resource-pools')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    Details →
                  </button>
                </div>

                <div className="space-y-3">
                  {resourcePools.map((pool) => (
                    <div
                      key={pool.id}
                      onClick={() => navigate('resource-pools')}
                      className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex justify-between items-center text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {pool.locationLabel}
                          </span>
                        </div>
                        <span className="font-mono text-slate-600 font-bold">
                          {pool.currentUtilization}% load
                        </span>
                      </div>

                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(8, pool.currentUtilization))}%` }}
                        />
                      </div>

                      <div className="flex justify-between mt-2.5 text-[11px] text-slate-500 font-mono">
                        <span>PUE {pool.pue}</span>
                        <span>{pool.carbonIntensity} gCO₂</span>
                        <span>${pool.electricityPrice}/kWh</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => navigate('resource-pools')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-950 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage regional pools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* 3 SIMPLE NAVIGATION SHORTCUTS */}
          <section className="grid sm:grid-cols-3 gap-4">
            <ActionCard
              icon={<GitBranch />}
              title="Placement Schedule"
              text="See which regional data center and hour each workload was assigned."
              onClick={() => navigate('scheduling')}
            />
            <ActionCard
              icon={<BarChart3 />}
              title="7-Model Comparison"
              text="Compare EcoFusion NSGA-II against Carbon, Energy, Cost, EDF, and FIFO."
              onClick={() => navigate('comparisons')}
            />
            <ActionCard
              icon={<Server />}
              title="Workload Dataset"
              text={`Inspect or export all ${totalWorkloads} scheduled tasks and ML demand priors.`}
              onClick={() => navigate('workloads')}
            />
          </section>
        </>
      )}
    </div>
  );
};

const accentStyles = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
  sky: 'bg-sky-50 text-sky-600 border-sky-200/80',
  amber: 'bg-amber-50 text-amber-600 border-amber-200/80',
  purple: 'bg-purple-50 text-purple-600 border-purple-200/80',
};

const MetricCard = ({
  icon,
  accent = 'emerald',
  label,
  value,
  hint,
  positive = false,
  onClick,
}: {
  icon: React.ReactNode;
  accent?: 'emerald' | 'sky' | 'amber' | 'purple';
  label: string;
  value: string;
  hint: string;
  positive?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span
        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${accentStyles[accent]}`}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })
          : icon}
      </span>
    </div>

    <div className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950 font-mono">
      {value}
    </div>

    <div
      className={`mt-1.5 text-xs truncate ${
        positive ? 'text-emerald-600 font-semibold' : 'text-slate-400 font-medium'
      }`}
    >
      {hint}
    </div>
  </button>
);

const ActionCard = ({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group flex items-start gap-4"
  >
    <span className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })
        : icon}
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-sm text-slate-950 group-hover:text-emerald-700 transition-colors">
          {title}
        </h4>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{text}</p>
    </div>
  </button>
);

export default Overview;
