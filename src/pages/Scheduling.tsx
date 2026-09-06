import React, { useState } from 'react';
import type { CandidateOption, Workload } from '../types';
import { simulatorService } from '../services/simulatorService';
import { demoParetoPoints } from '../data/mockData';
import {
  GitBranch,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
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
  const resourcePools = simulatorService.getResourcePools();
  const timeSlots = simulatorService.getTimeSlots().slice(0, 8); // 8 slots: 00 to 07

  const [selectedWorkloadId, setSelectedWorkloadId] = useState<string>(workloads[0]?.id || 'W1');
  const activeWorkload = workloads.find((w) => w.id === selectedWorkloadId) || workloads[0];
  const candidateOptions: CandidateOption[] = simulatorService.evaluateCandidateOptions(selectedWorkloadId);

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateOption | null>(
    candidateOptions.find((c) => c.slaFeasible) || candidateOptions[0] || null
  );

  const handleSelectWorkload = (wlId: string) => {
    setSelectedWorkloadId(wlId);
    const newOptions = simulatorService.evaluateCandidateOptions(wlId);
    const feasible = newOptions.find((c) => c.slaFeasible) || newOptions[0];
    setSelectedCandidate(feasible || null);
  };

  // Mock grid mapping for demonstration (where each workload is assigned in WHERE x WHEN)
  const gridAssignments: { [key: string]: Workload[] } = {};
  workloads.forEach((w, idx) => {
    const pool = resourcePools[idx % resourcePools.length];
    const slotIdx = (idx * 2) % timeSlots.length;
    const slot = timeSlots[slotIdx];
    const key = `${pool.id}-${slot.id}`;
    if (!gridAssignments[key]) gridAssignments[key] = [];
    gridAssignments[key].push(w);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner explaining WHERE + WHEN */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-sm">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950 tracking-tight">Spatial-Temporal Scheduling Matrix</h3>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-bold">
                WHERE + WHEN
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              Evaluating spatial routing (<strong className="text-slate-950 font-semibold">WHERE</strong>: Regional Resource Pool) and temporal execution window (<strong className="text-slate-950 font-semibold">WHEN</strong>: Hourly Time Slot) to minimize carbon and cost while strictly respecting SLA deadlines.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 shrink-0">
          <span className="text-slate-950 font-bold">NSGA-II</span> Non-Dominated Sorting Core
        </div>
      </div>

      {/* 1. VISUAL WHERE x WHEN MATRIX GRID */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-900" />
              <span>Placement Schedule Grid: Resource Pools (WHERE) × Time Slots (WHEN)</span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Workloads scheduled into spatial pools and hourly slots. Click any task chip to inspect its parameters.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-950" /> Scheduled
            <span className="w-2 h-2 rounded-full bg-emerald-600 ml-2" /> Solar Peak Window
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-3 font-sans text-xs text-slate-600 uppercase bg-slate-50 w-48 font-bold">
                  Resource Pool (WHERE)
                </th>
                {timeSlots.map((slot) => (
                  <th key={slot.id} className="p-2.5 font-sans text-xs text-center text-slate-700 border-l border-slate-200 bg-slate-50 font-bold">
                    <div>Slot {slot.label}</div>
                    <div className="text-xs text-slate-500 font-normal">{slot.startTime}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {resourcePools.map((pool) => (
                <tr key={pool.id} className="hover:bg-slate-50/50">
                  {/* Pool Row Header */}
                  <td className="p-3 bg-slate-50/50 border-r border-slate-200">
                    <div className="font-bold text-slate-950 text-xs">{pool.locationLabel}</div>
                    <div className="text-xs text-slate-500 font-mono">{pool.id} · PUE {pool.pue}</div>
                    <div className="text-xs text-slate-700 font-mono mt-0.5 font-semibold">{pool.carbonIntensity} gCO₂/kWh</div>
                  </td>

                  {/* Slot Cells */}
                  {timeSlots.map((slot) => {
                    const key = `${pool.id}-${slot.id}`;
                    const assigned = gridAssignments[key] || [];

                    return (
                      <td
                        key={slot.id}
                        className="p-2 border-l border-slate-200 align-top min-w-[100px] h-20"
                      >
                        {assigned.length > 0 ? (
                          <div className="space-y-1.5">
                            {assigned.map((w) => {
                              const isSelected = selectedWorkloadId === w.id;
                              return (
                                <button
                                  key={w.id}
                                  onClick={() => handleSelectWorkload(w.id)}
                                  className={`w-full p-1.5 rounded text-left transition-all cursor-pointer block border ${
                                    isSelected
                                      ? 'bg-slate-950 text-white font-bold border-slate-950 shadow-sm'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span>{w.id}</span>
                                    <span>{w.duration}h</span>
                                  </div>
                                  <div className="truncate text-[10px] opacity-90 mt-0.5 font-medium">
                                    {w.name.split(' ')[0]}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-mono">
                            idle
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. STEP 1: SELECT & INSPECT WORKLOAD */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Select Workload Profile for Candidate Analysis
          </label>
          <span className="text-xs font-mono text-slate-950 font-semibold">
            Active: {activeWorkload.id} ({activeWorkload.name})
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {workloads.map((wl) => (
            <button
              key={wl.id}
              onClick={() => handleSelectWorkload(wl.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                selectedWorkloadId === wl.id
                  ? 'bg-slate-950 text-white font-semibold border-slate-950 shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-950 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono">{wl.id}:</span> {wl.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Selected Workload Specs Banner */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-mono block">Compute Footprint</span>
            <span className="font-mono font-bold text-slate-950">{activeWorkload.cpuRequired} Cores · {activeWorkload.memoryRequired} GB</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-mono block">Execution Duration</span>
            <span className="font-mono font-bold text-slate-950">{activeWorkload.duration} Hours</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-mono block">Arrival Time</span>
            <span className="font-mono text-slate-950 font-bold">{activeWorkload.arrivalTime}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-mono block">Hard Deadline</span>
            <span className="font-mono text-rose-600 font-bold">{activeWorkload.deadline}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-mono block">SLA Condition</span>
            <span className="font-mono text-emerald-700 font-semibold">{activeWorkload.slaStatus}</span>
          </div>
        </div>
      </div>

      {/* 3. CANDIDATE OPTIONS MATRIX TABLE (Resource Pool x Time Slot) */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <span>Candidate Options Evaluation</span>
              <span className="text-xs text-slate-500 font-normal">
                (Regional Pool × Time Slot permutations for {activeWorkload.id})
              </span>
            </h4>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {candidateOptions.length} combinations ranked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">WHERE (Regional Pool)</th>
                <th className="py-3 px-4 font-semibold">WHEN (Time Slot)</th>
                <th className="py-3 px-3 font-semibold">PUE</th>
                <th className="py-3 px-3 text-right font-semibold">Energy (kWh)</th>
                <th className="py-3 px-3 text-right font-semibold">Carbon (gCO₂)</th>
                <th className="py-3 px-3 text-right font-semibold">Cost ($)</th>
                <th className="py-3 px-4 text-center font-semibold">SLA Feasibility</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              {candidateOptions.map((opt, idx) => {
                const isSelected =
                  selectedCandidate?.poolId === opt.poolId &&
                  selectedCandidate?.timeSlotId === opt.timeSlotId;

                return (
                  <tr
                    key={`${opt.poolId}-${opt.timeSlotId}-${idx}`}
                    onClick={() => setSelectedCandidate(opt)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-100 border-l-2 border-slate-950' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-950 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-900" />
                      <span className="font-semibold">{opt.poolName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({opt.region.split(' ')[0]})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {opt.timeSlotLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{opt.pue}</td>
                    <td className="py-3.5 px-3 text-right text-slate-700">{opt.estimatedEnergy.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right text-slate-950 font-semibold">{opt.estimatedCarbon.toFixed(1)}</td>
                    <td className="py-3.5 px-3 text-right text-slate-700">${opt.estimatedCost.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center">
                      {opt.slaFeasible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Feasible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-700 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 font-semibold">
                          <XCircle className="w-3 h-3" /> SLA Violated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidate(opt);
                        }}
                        className={`px-3 py-1 rounded text-[11px] font-sans transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950 text-white font-semibold shadow-sm'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
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

      {/* 4. SELECTED DECISION HIGHLIGHT */}
      {selectedCandidate && (
        <div className="p-6 rounded-xl bg-slate-950 text-white shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Optimal Candidate Decision for {activeWorkload.id}</span>
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/20 font-semibold">
              WHERE & WHEN RESOLVED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">WHERE (Regional Pool)</span>
              <p className="text-sm font-bold text-white">{selectedCandidate.poolName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedCandidate.region}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">WHEN (Execution Slot)</span>
              <p className="text-sm font-bold text-white font-mono">{selectedCandidate.timeSlotLabel}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Duration: {activeWorkload.duration}h</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Energy & Carbon</span>
              <p className="text-xs font-mono font-bold text-white">{selectedCandidate.estimatedEnergy} kWh</p>
              <p className="text-xs font-mono font-bold text-emerald-400">{selectedCandidate.estimatedCarbon} gCO₂</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Electricity Cost & SLA</span>
              <p className="text-sm font-mono font-bold text-white">${selectedCandidate.estimatedCost}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">SLA Deadline Compliant</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. PARETO SCATTER PREVIEW */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-950">Illustrative Pareto Front (Energy vs. Carbon vs. Cost)</h4>
            <p className="text-xs text-slate-600">Multi-objective non-dominated solutions generated by NSGA-II</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
            ILLUSTRATIVE
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" dataKey="costUsd" name="Cost" unit="$" stroke="#64748b" fontSize={10} />
              <YAxis type="number" dataKey="carbonKg" name="Carbon" unit="kg" stroke="#64748b" fontSize={10} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#09090b', borderRadius: '8px', fontSize: '11px' }}
              />
              <Scatter name="Candidate Solutions" data={demoParetoPoints} fill="#09090b">
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

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
          <span>
            <strong>Note:</strong> Illustrative optimization output based on trace-driven simulation runs. Actual results depend on workload characteristics and grid carbon dynamics.
          </span>
        </div>
      </div>
    </div>
  );
};
