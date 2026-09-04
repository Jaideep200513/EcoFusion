import React from 'react';
import { baselineComparisons } from '../data/mockData';
import { ChartCard } from '../components/common/ChartCard';
import {
  BarChart3,
  Sparkles,
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

export const Results: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Experiment Results & Baseline Benchmark</h3>
            <p className="text-xs text-slate-400">
              Comparative analysis of spatial-temporal scheduling algorithms under identical workload seeds
            </p>
          </div>
        </div>

        <span className="px-3 py-1 text-xs font-mono rounded-full bg-slate-900 text-cyan-300 border border-cyan-800">
          DEMO BASELINE EVALUATION
        </span>
      </div>

      {/* Comparison Table across Algorithms */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <span>Comparative Performance Matrix</span>
          <span className="text-xs text-slate-400 font-normal">
            (5 Algorithms evaluated over 24 Workloads)
          </span>
        </h4>

        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Scheduling Algorithm</th>
                  <th className="px-4 py-3">Total Energy (kWh)</th>
                  <th className="px-4 py-3">Carbon Output (kgCO₂)</th>
                  <th className="px-4 py-3">Operational Cost ($)</th>
                  <th className="px-4 py-3">SLA Violation Rate</th>
                  <th className="px-4 py-3">Avg Duration (hrs)</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {baselineComparisons.map((item) => (
                  <tr
                    key={item.algorithm}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      item.isEcoFusion
                        ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400 font-semibold'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.isEcoFusion && (
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span
                          className={
                            item.isEcoFusion ? 'text-cyan-300 font-bold' : 'text-slate-200'
                          }
                        >
                          {item.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-300">
                      {item.totalEnergyKwh.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-300">
                      {item.totalCarbonKg.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-200">${item.totalCostUsd}</td>
                    <td className="px-4 py-3 font-mono">
                      <span
                        className={
                          item.slaViolationRate < 3
                            ? 'text-emerald-400 font-bold'
                            : item.slaViolationRate < 10
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {item.slaViolationRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {item.avgCompletionTimeHours}h
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.isEcoFusion ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                          BEST PARTO
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Baseline</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 2: Charts for Energy & Carbon Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon Comparison Bar */}
        <ChartCard
          title="Carbon Emissions Comparison Across Algorithms"
          subtitle="Reduction in total kgCO₂ output (EcoFusion Multi-Objective vs Single-Objective)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={baselineComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="totalCarbonKg" name="Carbon (kgCO₂)" radius={[6, 6, 0, 0]}>
                {baselineComparisons.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isEcoFusion ? '#10b981' : '#06b6d4'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Energy Consumption Comparison Bar */}
        <ChartCard
          title="Total Energy Consumption Comparison (kWh)"
          subtitle="Energy efficiency savings incorporating facility PUE factors"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={baselineComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="totalEnergyKwh" name="Energy (kWh)" radius={[6, 6, 0, 0]}>
                {baselineComparisons.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isEcoFusion ? '#f59e0b' : '#8b5cf6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Operational Cost & SLA Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Cost Comparison */}
        <ChartCard
          title="Operational Electricity Cost ($ USD)"
          subtitle="Cost optimization across dynamic time slot electricity rates"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={baselineComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="totalCostUsd" name="Operational Cost ($)" radius={[6, 6, 0, 0]}>
                {baselineComparisons.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isEcoFusion ? '#06b6d4' : '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* SLA Violation Rate */}
        <ChartCard
          title="SLA Violation Rate (%) Comparison"
          subtitle="Constraint enforcement ensuring workloads complete prior to deadlines"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={baselineComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="slaViolationRate" name="SLA Violation Rate %" radius={[6, 6, 0, 0]}>
                {baselineComparisons.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isEcoFusion ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
