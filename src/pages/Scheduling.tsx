import React, { useState, useEffect } from 'react';
import type { CandidateOption, Workload } from '../types';
import { simulatorService, type ParetoPoint } from '../services/simulatorService';
import {
  GitBranch,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Zap,
  Leaf,
  DollarSign,
  Filter,
  Brain,
  ShieldCheck,
  Cpu,
  Clock,
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
  const [workloads, setWorkloads] = useState<Workload[]>(simulatorService.getWorkloads());
  const [resourcePools, setResourcePools] = useState(simulatorService.getResourcePools());
  const [timeSlots] = useState(simulatorService.getTimeSlots());
  const [paretoPoints, setParetoPoints] = useState<ParetoPoint[]>(simulatorService.getLatestParetoSolutions());

  const [selectedWorkloadId, setSelectedWorkloadId] = useState<string>(workloads[0]?.id || 'W1');
  const activeWorkload = workloads.find((w) => w.id === selectedWorkloadId) || workloads[0];
  const candidateOptions: CandidateOption[] = simulatorService.evaluateCandidateOptions(selectedWorkloadId);

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateOption | null>(
    candidateOptions.find((c) => c.slaFeasible) || candidateOptions[0] || null
  );

  useEffect(() => {
    const unsubscribe = simulatorService.subscribe(() => {
      setWorkloads([...simulatorService.getWorkloads()]);
      setResourcePools([...simulatorService.getResourcePools()]);
      setParetoPoints([...simulatorService.getLatestParetoSolutions()]);
    });
    return unsubscribe;
  }, []);

  const handleSelectWorkload = (wlId: string) => {
    setSelectedWorkloadId(wlId);
    const newOptions = simulatorService.evaluateCandidateOptions(wlId);
    const feasible = newOptions.find((c) => c.slaFeasible) || newOptions[0];
    setSelectedCandidate(feasible || null);
  };

  const handleSelectParetoSolution = (solutionKey: string) => {
    simulatorService.selectParetoSolution(solutionKey);
    setParetoPoints([...simulatorService.getLatestParetoSolutions()]);
  };

  // Real grid mapping: where each workload is placed in (WHERE pool × WHEN time slot)
  const gridAssignments: { [key: string]: Workload[] } = {};
  workloads.forEach((w) => {
    const poolId = w.assignedPoolId || w.assignedDcId || resourcePools[0]?.id || 'POOL-BOM';
    const rawSlot = w.assignedTimeSlot || '00';
    const slotId = rawSlot.startsWith('TS-') ? rawSlot : `TS-${rawSlot.padStart(2, '0')}`;
    const key = `${poolId}-${slotId}`;
    if (!gridAssignments[key]) gridAssignments[key] = [];
    gridAssignments[key].push(w);
  });

  const activePareto = paretoPoints.find((p) => p.selected) || paretoPoints[0];

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
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Multi-objective optimization mapping computational jobs across regional resource pools (<strong className="text-slate-950">WHERE</strong>) and discrete hourly time slots (<strong className="text-slate-950">WHEN</strong>) to minimize carbon intensity and energy costs.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 shrink-0 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Frontier: <strong className="text-slate-950">{activePareto?.label || 'NSGA-II Balanced'}</strong></span>
        </div>
      </div>

      {/* Pareto Frontier Solution Selector */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Select Active Pareto Trade-off Solution</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Switching recalculates the entire placement grid and workload assignments immediately.</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{paretoPoints.length} Non-Dominated Solutions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {paretoPoints.map((point) => (
            <button
              key={point.id}
              onClick={() => handleSelectParetoSolution(point.solutionKey)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                point.selected
                  ? 'bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-slate-900/10'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    point.selected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {point.slaMargin} SLA
                  </span>
                  {point.selected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <h5 className="text-xs font-bold truncate">{point.label}</h5>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/40 text-[11px] font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span className={point.selected ? 'text-slate-300' : 'text-slate-500'}>Carbon:</span>
                  <span className="font-bold">{point.carbonKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className={point.selected ? 'text-slate-300' : 'text-slate-500'}>Cost:</span>
                  <span className="font-bold">${point.costUsd}</span>
                </div>
              </div>
            </button>
          ))}
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
          <div className="text-xs font-mono text-slate-600 flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-950" /> Scheduled Task</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-200" /> Low Grid Carbon Window</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 border border-slate-200 font-bold text-slate-700 text-left w-44">
                  Regional Pool (WHERE)
                </th>
                {timeSlots.slice(0, 12).map((slot) => {
                  const isSolar = parseInt(slot.label, 10) >= 10 && parseInt(slot.label, 10) <= 15;
                  return (
                    <th
                      key={slot.id}
                      className={`p-2 border border-slate-200 font-mono text-center min-w-[76px] ${
                        isSolar ? 'bg-emerald-50/60 text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="font-bold">{slot.startTime}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {slot.carbonIntensity}g
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {resourcePools.map((pool) => (
                <tr key={pool.id} className="hover:bg-slate-50/50">
                  <td className="p-3 border border-slate-200 font-medium bg-slate-50/80">
                    <div className="font-bold text-slate-950">{pool.locationLabel}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{pool.id} · PUE {pool.pue}</div>
                  </td>

                  {timeSlots.slice(0, 12).map((slot) => {
                    const key = `${pool.id}-${slot.id}`;
                    const assigned = gridAssignments[key] || [];
                    const isSolar = parseInt(slot.label, 10) >= 10 && parseInt(slot.label, 10) <= 15;

                    return (
                      <td
                        key={slot.id}
                        className={`p-1.5 border border-slate-200 align-top transition-colors min-h-[64px] ${
                          isSolar ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          {assigned.map((w) => (
                            <button
                              key={w.id}
                              onClick={() => handleSelectWorkload(w.id)}
                              className={`w-full text-left px-2 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer truncate block shadow-xs ${
                                selectedWorkloadId === w.id
                                  ? 'bg-slate-950 text-white ring-2 ring-slate-900'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
                              }`}
                              title={`${w.name} (${w.cpuRequired}c · ${w.duration}h)`}
                            >
                              {w.id} <span className="font-sans font-normal opacity-75">({w.cpuRequired}c)</span>
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. ARCHITECTURE PIPELINE STAGES: PREDICTION -> FEASIBILITY -> NSGA-II METRICS */}
      {(() => {
        const feasibleCount = candidateOptions.filter((c) => c.slaFeasible).length;
        const infeasibleCount = candidateOptions.length - feasibleCount;
        const arrivalHour = parseInt(activeWorkload?.arrivalTime.split(':')[0] || '0', 10);
        const deadlineHour = parseInt(activeWorkload?.deadline.split(':')[0] || '24', 10);
        const predictedDur = activeWorkload?.predictedDuration ?? activeWorkload?.duration ?? 2;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* STAGE 02: Workload Profile & Random Forest Demand Prediction */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-950">Stage 02: RF Demand Model</h4>
                  </div>
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                    {activeWorkload?.id}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-sans">Task Name:</span>
                    <span className="font-bold text-slate-950 font-sans truncate max-w-[140px]">{activeWorkload?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-sans">Arrival Window:</span>
                    <span className="font-bold text-slate-950">{activeWorkload?.arrivalTime} (H={arrivalHour})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-sans">Hard SLA Deadline:</span>
                    <span className="font-bold text-rose-700">{activeWorkload?.deadline} (H={deadlineHour})</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 font-sans flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-emerald-600" /> Random Forest Regressor
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-bold">
                      R² ≈ 0.94
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-white p-2 rounded border border-emerald-200/50">
                      <span className="text-[10px] text-slate-500 block font-sans">Pred. CPU</span>
                      <strong className="text-slate-900">{activeWorkload?.predictedCpu ?? activeWorkload?.cpuRequired} Cores</strong>
                      <span className="text-[10px] text-slate-400 block font-sans">Req: {activeWorkload?.cpuRequired}c</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-200/50">
                      <span className="text-[10px] text-slate-500 block font-sans">Pred. Duration</span>
                      <strong className="text-slate-900">{predictedDur} Hours</strong>
                      <span className="text-[10px] text-slate-400 block font-sans">Req: {activeWorkload?.duration}h</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic font-sans leading-tight">
                    ML predicts resource requirements; NSGA-II handles spatial-temporal optimization.
                  </p>
                </div>
              </div>

              {/* STAGE 03: Feasibility Engine Pruning */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-900" />
                    <h4 className="text-sm font-bold text-slate-950">Stage 03: Feasibility Engine</h4>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                    Pruning Filter
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-slate-700 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-semibold">1. Arrival Check:</span>
                      <span className="font-bold text-emerald-700">T_start ≥ {arrivalHour}:00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-semibold">2. Deadline Check:</span>
                      <span className="font-bold text-emerald-700">T_start + {predictedDur}h ≤ {deadlineHour}:00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-semibold">3. Host Capacity:</span>
                      <span className="font-bold text-emerald-700">Pool_avail ≥ {activeWorkload?.predictedCpu ?? activeWorkload?.cpuRequired}c</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                      <div className="text-[10px] font-sans text-rose-700 font-medium">Infeasible Pruned</div>
                      <div className="text-lg font-bold">{infeasibleCount}</div>
                      <div className="text-[10px] text-rose-600 font-sans">Violates Arrival/SLA</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <div className="text-[10px] font-sans text-emerald-700 font-medium">Valid for NSGA-II</div>
                      <div className="text-lg font-bold">{feasibleCount}</div>
                      <div className="text-[10px] text-emerald-600 font-sans">Passed to optimizer</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
                  <span>Total Combinations:</span>
                  <span className="font-bold text-slate-900">{candidateOptions.length} (WHERE × WHEN)</span>
                </div>
              </div>

              {/* STAGE 04: Active Placement Metrics & Trade-offs */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-950">Stage 04: NSGA-II Solution</h4>
                  </div>
                  {selectedCandidate?.slaFeasible ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Feasible
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" /> Infeasible
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1 font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-sans">Assigned Pool:</span>
                    <span className="font-bold text-slate-950">{selectedCandidate?.datacenterName || selectedCandidate?.poolName || 'Mumbai'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-sans">Assigned Window:</span>
                    <span className="font-bold text-slate-950">{selectedCandidate?.timeSlotLabel || '10:00 - 11:00'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 mb-0.5">
                      <Zap className="w-3.5 h-3.5 text-slate-900" />
                      <span className="font-semibold font-sans">E_DC</span>
                    </div>
                    <p className="text-sm font-bold font-mono text-slate-950">{selectedCandidate?.estimatedEnergy || 0} kWh</p>
                    <p className="text-[10px] text-slate-500 font-mono">PUE: {selectedCandidate?.pue || 1.2}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 mb-0.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold font-sans">Carbon</span>
                    </div>
                    <p className="text-sm font-bold font-mono text-slate-950">{selectedCandidate?.estimatedCarbon || 0}g</p>
                    <p className="text-[10px] text-slate-500 font-mono">{selectedCandidate?.carbonIntensity || 420} g/kWh</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 mb-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-900" />
                      <span className="font-semibold font-sans">Cost</span>
                    </div>
                    <p className="text-sm font-bold font-mono text-slate-950">${selectedCandidate?.estimatedCost || 0}</p>
                    <p className="text-[10px] text-slate-500 font-mono">${selectedCandidate?.electricityPrice || 0.12}/kWh</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Options Trade-off Table */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-900" />
                    <span>Candidate (WHERE × WHEN) Evaluations for {activeWorkload?.id}</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    NSGA-II evaluates each feasible pool and time slot combination against multi-objective trade-offs. Click any row to inspect candidate details.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">Showing Top 8 Evaluated Candidates</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700">
                      <th className="p-2.5 border border-slate-200 text-left font-bold">Candidate</th>
                      <th className="p-2.5 border border-slate-200 text-left font-bold">Location (WHERE)</th>
                      <th className="p-2.5 border border-slate-200 text-left font-bold">Time Window (WHEN)</th>
                      <th className="p-2.5 border border-slate-200 text-right font-bold">Energy (E_DC)</th>
                      <th className="p-2.5 border border-slate-200 text-right font-bold">Carbon (gCO₂)</th>
                      <th className="p-2.5 border border-slate-200 text-right font-bold">Cost ($)</th>
                      <th className="p-2.5 border border-slate-200 text-center font-bold">SLA Feasibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidateOptions.slice(0, 8).map((cand, idx) => {
                      const isSelected = selectedCandidate?.timeSlotId === cand.timeSlotId && selectedCandidate?.poolId === cand.poolId;
                      const candLabel = String.fromCharCode(65 + idx);
                      return (
                        <tr
                          key={`${cand.poolId}-${cand.timeSlotId}`}
                          onClick={() => setSelectedCandidate(cand)}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-slate-100 font-semibold' : ''
                          }`}
                        >
                          <td className="p-2.5 border border-slate-200 font-mono font-bold text-slate-950">
                            Candidate {candLabel} {isSelected && '★'}
                          </td>
                          <td className="p-2.5 border border-slate-200">
                            <span className="font-bold text-slate-900">{cand.datacenterName || cand.poolName}</span>
                            <span className="text-slate-500 font-mono text-[10px] ml-1.5">PUE {cand.pue}</span>
                          </td>
                          <td className="p-2.5 border border-slate-200 font-mono text-slate-700">{cand.timeSlotLabel}</td>
                          <td className="p-2.5 border border-slate-200 text-right font-mono text-slate-950">{cand.estimatedEnergy} kWh</td>
                          <td className="p-2.5 border border-slate-200 text-right font-mono text-slate-950">{cand.estimatedCarbon} g</td>
                          <td className="p-2.5 border border-slate-200 text-right font-mono text-slate-950">${cand.estimatedCost}</td>
                          <td className="p-2.5 border border-slate-200 text-center">
                            {cand.slaFeasible ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Feasible
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" /> Infeasible
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. PARETO SCATTER FRONTIER */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-950">Multi-Objective Non-Dominated Pareto Frontier</h4>
            <p className="text-xs text-slate-600 mt-0.5">Empirical trade-off frontier balancing electricity cost vs carbon emissions.</p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
            PARETO CONVERGED
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
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#09090b', borderRadius: '8px', fontSize: '11px' }}
              />
              <Scatter name="Candidate Solutions" data={paretoPoints} fill="#09090b">
                {paretoPoints.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.selected ? '#059669' : '#0f172a'}
                    stroke={entry.selected ? '#047857' : '#64748b'}
                    strokeWidth={entry.selected ? 3 : 1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
