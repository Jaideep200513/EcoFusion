import React, { useState } from 'react';
import type { CandidateOption } from '../types';
import { simulatorService } from '../services/simulatorService';
import { ChartCard } from '../components/common/ChartCard';
import { demoParetoPoints } from '../data/mockData';
import {
  GitBranch,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  GitMerge,
  Sparkles,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const Scheduling: React.FC = () => {
  const workloads = simulatorService.getWorkloads();
  const [selectedWorkloadId, setSelectedWorkloadId] = useState<string>(workloads[0]?.id || 'WL-101');

  const activeWorkload = workloads.find((w) => w.id === selectedWorkloadId) || workloads[0];
  const candidateOptions: CandidateOption[] = simulatorService.evaluateCandidateOptions(selectedWorkloadId);

  // Selected candidate decision state
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateOption | null>(
    candidateOptions.find((c) => c.slaFeasible) || candidateOptions[0] || null
  );

  const handleSelectWorkload = (wlId: string) => {
    setSelectedWorkloadId(wlId);
    const newOptions = simulatorService.evaluateCandidateOptions(wlId);
    const feasible = newOptions.find((c) => c.slaFeasible) || newOptions[0];
    setSelectedCandidate(feasible || null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining WHERE + WHEN */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-950/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg glow-cyan">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  Spatial-Temporal Scheduling Workspace
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  WHERE + WHEN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Evaluate spatial placement (<strong className="text-cyan-300">WHERE</strong>: Data Center ID) and temporal execution (<strong className="text-emerald-300">WHEN</strong>: Time Slot) for cloud workloads under carbon, energy, cost, and SLA constraints.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 shrink-0">
            <div className="flex items-center gap-2 text-slate-400">
              <GitMerge className="w-3.5 h-3.5 text-amber-400" />
              <span>NSGA-II Integration:</span>
              <span className="text-amber-400 font-semibold">Phase 2 (Week 4)</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Current matrix displays candidate heuristic evaluations
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Select Workload */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Step 1: Select Workload for Scheduling Decision
        </label>
        <div className="flex flex-wrap gap-2">
          {workloads.slice(0, 8).map((wl) => (
            <button
              key={wl.id}
              onClick={() => handleSelectWorkload(wl.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                selectedWorkloadId === wl.id
                  ? 'bg-gradient-to-r from-cyan-950 to-slate-900 text-cyan-300 border-cyan-500/50 shadow-md glow-cyan'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="font-mono text-cyan-400">{wl.id}</span>
              <span className="truncate max-w-[140px]">{wl.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Workload Summary Card */}
      {activeWorkload && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">CPU & Memory</span>
            <span className="font-bold text-slate-100">{activeWorkload.cpuRequired} cores / {activeWorkload.memoryRequired} GB</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Arrival Time</span>
            <span className="font-mono text-cyan-300">{activeWorkload.arrivalTime}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Execution Duration</span>
            <span className="font-mono text-slate-200">{activeWorkload.duration} hours</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">SLA Deadline</span>
            <span className="font-mono text-rose-400 font-bold">{activeWorkload.deadline}</span>
          </div>
        </div>
      )}

      {/* Step 2: Candidate Options Matrix (Data Center x Time Slot) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>Candidate Options Matrix</span>
            <span className="text-xs text-slate-400 font-normal">
              (Data Center × Time Slot combinations)
            </span>
          </h4>
          <span className="text-[11px] text-cyan-400 font-mono">
            {candidateOptions.length} combinations evaluated
          </span>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">WHERE (Data Center)</th>
                  <th className="px-4 py-3">WHEN (Time Slot)</th>
                  <th className="px-4 py-3">PUE</th>
                  <th className="px-4 py-3">Est. Energy (kWh)</th>
                  <th className="px-4 py-3">Est. Carbon (gCO₂)</th>
                  <th className="px-4 py-3">Est. Cost ($)</th>
                  <th className="px-4 py-3">SLA Feasible</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {candidateOptions.map((opt, idx) => {
                  const isSelected =
                    selectedCandidate?.datacenterId === opt.datacenterId &&
                    selectedCandidate?.timeSlotId === opt.timeSlotId;

                  return (
                    <tr
                      key={`${opt.datacenterId}-${opt.timeSlotId}-${idx}`}
                      onClick={() => setSelectedCandidate(opt)}
                      className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{opt.datacenterName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{opt.timeSlotLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{opt.pue}</td>
                      <td className="px-4 py-3 font-mono text-amber-300">{opt.estimatedEnergy}</td>
                      <td className="px-4 py-3 font-mono text-emerald-300">{opt.estimatedCarbon}</td>
                      <td className="px-4 py-3 font-mono text-slate-200">${opt.estimatedCost}</td>
                      <td className="px-4 py-3">
                        {opt.slaFeasible ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Feasible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                            <XCircle className="w-3 h-3" /> SLA Violated
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(opt);
                          }}
                          className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 3: Selected Scheduling Decision Box */}
      {selectedCandidate && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Selected Spatial-Temporal Scheduling Decision</span>
            </h4>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              WHERE & WHEN RESOLVED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">WHERE (Data Center)</span>
              <p className="text-sm font-bold text-cyan-300">{selectedCandidate.datacenterName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{selectedCandidate.region}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">WHEN (Time Slot)</span>
              <p className="text-sm font-bold text-emerald-300 font-mono">{selectedCandidate.timeSlotLabel}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Execution Horizon</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Est. Energy & Carbon</span>
              <p className="text-xs font-bold text-amber-300 font-mono">{selectedCandidate.estimatedEnergy} kWh</p>
              <p className="text-xs font-bold text-emerald-400 font-mono">{selectedCandidate.estimatedCarbon} gCO₂</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Est. Operational Cost</span>
              <p className="text-base font-bold text-slate-100 font-mono">${selectedCandidate.estimatedCost}</p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">SLA Constraint Met</p>
            </div>
          </div>
        </div>
      )}

      {/* Illustrative Pareto Front Preview */}
      <ChartCard
        title="Illustrative Pareto Front — Demo"
        subtitle="Multi-objective trade-off space between Carbon Emissions, Energy, and Operational Cost"
        demoLabel="Illustrative Pareto Front — Demo"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" dataKey="costUsd" name="Cost" unit="$" stroke="#64748b" fontSize={11} />
            <YAxis type="number" dataKey="carbonKg" name="Carbon" unit="kg" stroke="#64748b" fontSize={11} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Solutions" data={demoParetoPoints} fill="#06b6d4">
              {demoParetoPoints.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.selected ? '#10b981' : '#06b6d4'}
                  stroke={entry.selected ? '#34d399' : '#0284c7'}
                  strokeWidth={entry.selected ? 3 : 1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
