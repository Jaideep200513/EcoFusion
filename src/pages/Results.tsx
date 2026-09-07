import React, { useState } from 'react';
import { baselineComparisons, demoParetoPoints } from '../data/mockData';
import {
  Leaf,
  Zap,
  DollarSign,
  ShieldCheck,
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
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';

export const Results: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'carbon' | 'cost' | 'sla' | 'pareto'>('summary');

  const ecoData = baselineComparisons.find((b) => b.isEcoFusion) || baselineComparisons[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-950 tracking-tight">Optimization Results Ledger</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
              SIMULATION RESULTS
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Empirical metrics logged across 24 simulated trace workloads under NSGA-II spatial-temporal optimization.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
          {(['summary', 'carbon', 'cost', 'sla', 'pareto'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-slate-950 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-950 font-medium'
              }`}
            >
              {tab === 'pareto' ? 'Pareto Front' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span>Total Carbon</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-950">
            {ecoData.totalCarbonKg.toFixed(2)} <span className="text-xs font-sans text-slate-500">kgCO₂</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            -28.6% vs Random Heuristic
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span>Total Facility Energy</span>
            <Zap className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-950">
            {ecoData.totalEnergyKwh.toFixed(1)} <span className="text-xs font-sans text-slate-500">kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            IT load + dynamic PUE overhead
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span>Electricity Cost</span>
            <DollarSign className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-950">
            ${ecoData.totalCostUsd.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Off-peak tariff shifting
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span>SLA Compliance</span>
            <ShieldCheck className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-950">
            {(100 - ecoData.slaViolationRate).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Strict deadline bounds enforced
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'summary' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-950">Multi-Objective Optimization Ledger</h4>
              <p className="text-xs text-slate-600">Summary of all 5 algorithms benchmarked over the 24-workload trace</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Algorithm</th>
                  <th className="py-3 px-4 text-right font-semibold">Energy (kWh)</th>
                  <th className="py-3 px-4 text-right font-semibold">Carbon (kgCO₂)</th>
                  <th className="py-3 px-4 text-right font-semibold">Cost ($)</th>
                  <th className="py-3 px-4 text-right font-semibold">SLA Violation Rate</th>
                  <th className="py-3 px-4 text-right font-semibold">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {baselineComparisons.map((item) => (
                  <tr
                    key={item.algorithm}
                    className={item.isEcoFusion ? 'bg-slate-950 text-white font-medium' : 'text-slate-800 hover:bg-slate-50'}
                  >
                    <td className="py-3.5 px-4 font-sans flex items-center gap-2">
                      {item.isEcoFusion && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      <span className={item.isEcoFusion ? 'font-bold text-white' : 'font-medium text-slate-950'}>
                        {item.label}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right ${item.isEcoFusion ? 'text-white' : 'text-slate-700'}`}>{item.totalEnergyKwh.toFixed(1)}</td>
                    <td className={`py-3.5 px-4 text-right ${item.isEcoFusion ? 'text-emerald-400 font-bold' : 'text-slate-950 font-semibold'}`}>
                      {item.totalCarbonKg.toFixed(2)}
                    </td>
                    <td className={`py-3.5 px-4 text-right ${item.isEcoFusion ? 'text-white' : 'text-slate-700'}`}>${item.totalCostUsd.toFixed(2)}</td>
                    <td className={`py-3.5 px-4 text-right ${item.slaViolationRate === 0 ? (item.isEcoFusion ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold') : 'text-rose-600'}`}>
                      {item.slaViolationRate.toFixed(1)}%
                    </td>
                    <td className={`py-3.5 px-4 text-right ${item.isEcoFusion ? 'text-slate-300' : 'text-slate-500'}`}>{item.avgCompletionTimeHours.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'carbon' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-950">Carbon Emissions Comparison by Algorithm</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={baselineComparisons} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#09090b', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="totalCarbonKg" fill="#09090b" radius={[4, 4, 0, 0]} name="Carbon (kgCO₂)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'cost' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-950">Operational Electricity Cost by Algorithm</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={baselineComparisons} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#09090b', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="totalCostUsd" fill="#09090b" radius={[4, 4, 0, 0]} name="Cost (USD)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'sla' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-950">SLA Violation Rate (%) Across Heuristics</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={baselineComparisons} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#09090b', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="slaViolationRate" fill="#e11d48" radius={[4, 4, 0, 0]} name="Violation Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'pareto' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-950">Pareto-Optimal Non-Dominated Solutions</h4>
          <p className="text-xs text-slate-600">Carbon vs. Electricity Cost Trade-off Surface</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="costUsd" name="Cost" unit="$" stroke="#64748b" fontSize={10} />
                <YAxis type="number" dataKey="carbonKg" name="Carbon" unit="kg" stroke="#64748b" fontSize={10} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#09090b', borderRadius: '8px', fontSize: '11px' }} />
                <Scatter name="Solutions" data={demoParetoPoints} fill="#09090b">
                  {demoParetoPoints.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.selected ? '#09090b' : '#64748b'}
                      stroke={entry.selected ? '#09090b' : '#94a3b8'}
                      strokeWidth={entry.selected ? 2 : 1}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Academic Disclaimer Note */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span>
          <strong>Note:</strong> Illustrative optimization output based on trace-driven simulation runs. Actual results depend on workload characteristics and grid carbon dynamics.
        </span>
      </div>
    </div>
  );
};
