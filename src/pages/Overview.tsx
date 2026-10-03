import React from 'react';
import { simulatorService } from '../services/simulatorService';
import { demoCarbonTimeSeries } from '../data/mockData';
import type { DashboardTab, SimulationResult } from '../types';
import { Server, Leaf, Zap, ShieldCheck, Play, ArrowRight, MapPin, Upload, Settings2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OverviewProps {
  onNavigateTab?: (tab: DashboardTab) => void;
  onRunSimulation: () => void;
  latestResult: SimulationResult | null;
  isSimulating?: boolean;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigateTab, onRunSimulation, latestResult, isSimulating }) => {
  const [workloads, setWorkloads] = React.useState(simulatorService.getWorkloads());
  const [resourcePools, setResourcePools] = React.useState(simulatorService.getResourcePools());
  const [summary, setSummary] = React.useState(simulatorService.calculateMetricsSummary());

  React.useEffect(() => simulatorService.subscribe(() => {
    setWorkloads([...simulatorService.getWorkloads()]);
    setResourcePools([...simulatorService.getResourcePools()]);
    setSummary(simulatorService.calculateMetricsSummary());
  }), []);

  const totalWorkloads = latestResult?.totalWorkloads ?? summary.totalWorkloads;
  const totalEnergy = latestResult?.totalEnergyKwh ?? summary.totalEnergyKwh;
  const totalCarbon = latestResult?.totalCarbonKg ?? summary.totalCarbonKg;
  const slaRate = latestResult ? 100 - latestResult.slaViolationRate : 100 - summary.slaViolationRate;
  const comparisons = latestResult?.comparisons || simulatorService.getLatestResult()?.comparisons || [];
  const random = comparisons.find(c => c.algorithm === 'RANDOM');
  const carbonSaving = random && random.totalCarbonKg > 0 ? Math.max(0, Math.round(((random.totalCarbonKg - totalCarbon) / random.totalCarbonKg) * 100)) : 0;

  const action = (tab: DashboardTab) => onNavigateTab?.(tab);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-slate-200 p-5 md:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready to schedule
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950">Make cloud scheduling greener.</h2>
            <p className="mt-2 text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
              EcoFusion finds a good place and time for each workload while balancing carbon, energy, cost, and deadlines.
            </p>
          </div>
          <button onClick={onRunSimulation} disabled={isSimulating} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm cursor-pointer">
            <Play className="w-4 h-4 fill-current" /> {isSimulating ? 'Running simulation…' : 'Run simulation'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <Metric icon={<Server />} label="Workloads" value={String(totalWorkloads)} hint="jobs in the current dataset" />
        <Metric icon={<Leaf />} label="Carbon" value={`${totalCarbon.toFixed(1)} kg`} hint={carbonSaving ? `${carbonSaving}% lower than random` : 'run a simulation to compare'} positive={!!carbonSaving} />
        <Metric icon={<Zap />} label="Energy" value={`${totalEnergy.toFixed(1)} kWh`} hint={`${resourcePools.length} resource regions`} />
        <Metric icon={<ShieldCheck />} label="SLA compliance" value={`${slaRate.toFixed(1)}%`} hint="workloads meeting deadlines" positive={slaRate >= 95} />
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-950">Grid carbon intensity</h3>
              <p className="text-xs text-slate-500 mt-1">How carbon intensity changes during the day</p>
            </div>
            <span className="text-xs text-slate-400">24 hours</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demoCarbonTimeSeries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs><linearGradient id="ecoCarbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.22} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="mumbai" stroke="#059669" strokeWidth={2} fill="url(#ecoCarbon)" name="Mumbai" />
                <Area type="monotone" dataKey="hyderabad" stroke="#64748b" strokeWidth={1.5} fill="none" name="Hyderabad" />
                <Area type="monotone" dataKey="singapore" stroke="#cbd5e1" strokeWidth={1.5} fill="none" name="Singapore" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-bold text-slate-950">Resource regions</h3><p className="text-xs text-slate-500 mt-1">Current utilization</p></div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-4">
            {resourcePools.map(pool => (
              <div key={pool.id}>
                <div className="flex justify-between text-xs mb-1.5"><span className="font-semibold text-slate-700">{pool.locationLabel}</span><span className="text-slate-500">{pool.currentUtilization}%</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, pool.currentUtilization)}%` }} /></div>
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-400"><span>PUE {pool.pue}</span><span>{pool.carbonIntensity} gCO₂/kWh</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3"><div><h3 className="font-bold text-slate-950">What do you want to do?</h3><p className="text-xs text-slate-500 mt-1">You can use these shortcuts instead of navigating through menus.</p></div></div>
        <div className="grid sm:grid-cols-3 gap-3">
          <ActionCard icon={<Upload />} title="Add workloads" text={`${workloads.length} jobs loaded`} onClick={() => action('workloads')} />
          <ActionCard icon={<Settings2 />} title="Configure simulation" text="Choose algorithm and parameters" onClick={() => action('simulation-setup')} />
          <ActionCard icon={<BarChartPlaceholder />} title="View results" text="See performance and comparisons" onClick={() => action('results')} />
        </div>
      </section>
    </div>
  );
};

const Metric = ({ icon, label, value, hint, positive = false }: { icon: React.ReactNode; label: string; value: string; hint: string; positive?: boolean }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><span className="text-emerald-600">{React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}</span>{label}</div>
    <div className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight text-slate-950">{value}</div>
    <div className={`mt-1 text-[11px] ${positive ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>{hint}</div>
  </div>
);

const ActionCard = ({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) => (
  <button onClick={onClick} className="text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group">
    <div className="flex items-center justify-between"><span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">{React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}</span><ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" /></div>
    <h4 className="mt-3 font-bold text-sm text-slate-950">{title}</h4><p className="mt-1 text-xs text-slate-500">{text}</p>
  </button>
);

const BarChartPlaceholder = () => <BarChart3Icon />;
const BarChart3Icon = () => <span className="block w-4 h-4 border-b-2 border-l-2 border-current relative"><span className="absolute left-1 bottom-0 w-1 h-2 bg-current" /><span className="absolute left-2.5 bottom-0 w-1 h-3.5 bg-current" /></span>;

export default Overview;
