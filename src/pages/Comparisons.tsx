import React, { useState } from 'react';
import { baselineComparisons } from '../data/mockData';
import {
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const Comparisons: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'carbon' | 'energy' | 'cost' | 'sla'>('carbon');

  const chartData = baselineComparisons.map((b) => ({
    name: b.label,
    carbon: b.totalCarbonKg,
    energy: b.totalEnergyKwh,
    cost: b.totalCostUsd,
    sla: b.slaViolationRate,
    isEcoFusion: b.isEcoFusion,
  }));

  const getMetricMeta = () => {
    switch (selectedMetric) {
      case 'carbon':
        return {
          title: 'Total Carbon Emissions (kgCO₂)',
          dataKey: 'carbon',
          color: '#10b981',
          unit: ' kgCO₂',
          bestAlgo: 'EcoFusion (NSGA-II) & Carbon-Aware',
          summary: 'EcoFusion achieves a 28.6% carbon reduction vs. Random and 23.4% vs. First-Fit by leveraging spatial grid differences.',
        };
      case 'energy':
        return {
          title: 'Total Energy Consumption (kWh)',
          dataKey: 'energy',
          color: '#06b6d4',
          unit: ' kWh',
          bestAlgo: 'Energy-Aware & EcoFusion',
          summary: 'EcoFusion minimizes both IT dynamic load and cooling overhead via PUE-aware spatial routing.',
        };
      case 'cost':
        return {
          title: 'Total Electricity Cost (USD)',
          dataKey: 'cost',
          color: '#f59e0b',
          unit: ' $',
          bestAlgo: 'EcoFusion (NSGA-II)',
          summary: 'Combining off-peak temporal shifting with lower regional tariffs produces substantial operational savings.',
        };
      case 'sla':
        return {
          title: 'SLA Violation Rate (%)',
          dataKey: 'sla',
          color: '#ef4444',
          unit: '%',
          bestAlgo: 'EcoFusion (NSGA-II)',
          summary: '0.0% SLA violation rate maintained by discarding non-feasible execution windows prior to Pareto sorting.',
        };
    }
  };

  const meta = getMetricMeta();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-950 tracking-tight">Baseline Algorithm Benchmarking</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-bold">
              EMPIRICAL
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Evaluating the multi-objective Pareto approach (NSGA-II) against standard single-metric and heuristic schedulers across 24 trace workloads.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200">
          <button
            onClick={() => setSelectedMetric('carbon')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              selectedMetric === 'carbon' ? 'bg-slate-950 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Carbon
          </button>
          <button
            onClick={() => setSelectedMetric('energy')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              selectedMetric === 'energy' ? 'bg-slate-950 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Energy
          </button>
          <button
            onClick={() => setSelectedMetric('cost')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              selectedMetric === 'cost' ? 'bg-slate-950 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Cost
          </button>
          <button
            onClick={() => setSelectedMetric('sla')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              selectedMetric === 'sla' ? 'bg-slate-950 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            SLA Rate
          </button>
        </div>
      </div>

      {/* Comparison Chart Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-950">{meta.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5">{meta.summary}</p>
          </div>
          <span className="text-xs font-mono text-emerald-700 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Best: {meta.bestAlgo}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#09090b', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val}${meta.unit}`, meta.title]}
              />
              <Bar dataKey={meta.dataKey} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isEcoFusion ? '#09090b' : '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Complete Comparison Table */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-950">Full Algorithm Performance Benchmark Table</h4>
          <p className="text-xs text-slate-600">Comparing energy, emissions, financial expenditure, and SLA compliance.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Algorithm Heuristic</th>
                <th className="py-3 px-4 text-right font-semibold">Energy (kWh)</th>
                <th className="py-3 px-4 text-right font-semibold">Carbon (kgCO₂)</th>
                <th className="py-3 px-4 text-right font-semibold">Cost (USD)</th>
                <th className="py-3 px-4 text-right font-semibold">SLA Violation Rate</th>
                <th className="py-3 px-4 text-right font-semibold">Avg Completion (hrs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {baselineComparisons.map((row) => (
                <tr
                  key={row.algorithm}
                  className={
                    row.isEcoFusion
                      ? 'bg-slate-950 text-white font-medium'
                      : 'text-slate-800 hover:bg-slate-50'
                  }
                >
                  <td className="py-3.5 px-4 font-sans flex items-center gap-2">
                    {row.isEcoFusion && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    <span className={row.isEcoFusion ? 'font-bold text-white' : 'font-medium text-slate-950'}>
                      {row.label}
                    </span>
                    {row.isEcoFusion && (
                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-white/20 text-white border border-white/30 font-bold">
                        Proposed Method
                      </span>
                    )}
                  </td>
                  <td className={`py-3.5 px-4 text-right ${row.isEcoFusion ? 'text-white' : 'text-slate-700'}`}>{row.totalEnergyKwh.toFixed(1)}</td>
                  <td
                    className={`py-3.5 px-4 text-right ${
                      row.isEcoFusion ? 'text-emerald-400 font-bold' : 'text-slate-950 font-semibold'
                    }`}
                  >
                    {row.totalCarbonKg.toFixed(2)}
                  </td>
                  <td className={`py-3.5 px-4 text-right ${row.isEcoFusion ? 'text-white' : 'text-slate-700'}`}>${row.totalCostUsd.toFixed(2)}</td>
                  <td
                    className={`py-3.5 px-4 text-right ${
                      row.slaViolationRate === 0
                        ? (row.isEcoFusion ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold')
                        : row.slaViolationRate > 10
                        ? 'text-rose-600 font-bold'
                        : 'text-amber-600 font-bold'
                    }`}
                  >
                    {row.slaViolationRate.toFixed(1)}%
                  </td>
                  <td className={`py-3.5 px-4 text-right ${row.isEcoFusion ? 'text-slate-300' : 'text-slate-500'}`}>{row.avgCompletionTimeHours.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <strong>Note:</strong> Illustrative optimization output based on trace-driven simulation runs. Actual results depend on workload characteristics and grid carbon dynamics.
        </div>
      </div>
    </div>
  );
};
