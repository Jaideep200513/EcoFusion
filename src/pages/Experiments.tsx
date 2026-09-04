import React, { useState } from 'react';
import type { Experiment } from '../types';
import { simulatorService } from '../services/simulatorService';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  FlaskConical,
  Plus,
} from 'lucide-react';

export const Experiments: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>(simulatorService.getExperiments());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Form state
  const [expForm, setExpForm] = useState({
    name: 'Multi-Objective Pareto Sensitivity Test',
    datasetName: 'Synthetic-Google-Cluster-v2',
    numWorkloads: 36,
    numDataCenters: 3,
    timeSlotDuration: 60,
    algorithm: 'ECOFUSION_NSGA2',
    randomSeed: 101,
    carbonWeight: 0.4,
    energyWeight: 0.3,
    costWeight: 0.3,
    maxSlaViolationRate: 5.0,
  });

  const handleCreateExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    simulatorService.createExperiment({
      name: expForm.name,
      datasetName: expForm.datasetName,
      numWorkloads: Number(expForm.numWorkloads),
      numDataCenters: Number(expForm.numDataCenters),
      timeSlotDuration: Number(expForm.timeSlotDuration),
      algorithm: expForm.algorithm,
      randomSeed: Number(expForm.randomSeed),
      config: {
        ...simulatorService.getSimulationConfig(),
        carbonWeight: Number(expForm.carbonWeight),
        energyWeight: Number(expForm.energyWeight),
        costWeight: Number(expForm.costWeight),
        maxSlaViolationRate: Number(expForm.maxSlaViolationRate),
      },
    });

    setExperiments([...simulatorService.getExperiments()]);
    setIsCreateModalOpen(false);
  };

  const handleRunExp = (expId: string) => {
    // Demo execute trigger
    const updated = experiments.map((exp) => {
      if (exp.id === expId) {
        return {
          ...exp,
          status: 'COMPLETED' as const,
          totalEnergyKwh: 3410,
          totalCarbonKg: 980,
          totalCostUsd: 462,
          slaViolationRate: 1.2,
        };
      }
      return exp;
    });
    setExperiments(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Research Experiment Suite</h3>
            <p className="text-xs text-slate-400">
              Configure parameters, set multi-objective weights, and manage simulation runs
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md glow-cyan transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Experiment</span>
        </button>
      </div>

      {/* Experiments Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Experiment ID & Name</th>
                <th className="px-4 py-3">Dataset</th>
                <th className="px-4 py-3">Workloads</th>
                <th className="px-4 py-3">DCs</th>
                <th className="px-4 py-3">Slot Duration</th>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">Seed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {experiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <span className="font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800 block w-max mb-1">
                      {exp.id}
                    </span>
                    <span className="text-slate-100 font-semibold">{exp.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">{exp.datasetName}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{exp.numWorkloads}</td>
                  <td className="px-4 py-3 text-slate-300">{exp.numDataCenters}</td>
                  <td className="px-4 py-3 text-slate-300">{exp.timeSlotDuration} min</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[10px] border border-emerald-800 font-bold">
                      {exp.algorithm}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{exp.randomSeed}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      type="custom"
                      label={exp.status}
                      status={
                        exp.status === 'COMPLETED'
                          ? 'success'
                          : exp.status === 'RUNNING'
                          ? 'info'
                          : 'warning'
                      }
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{exp.createdAt}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => {
                        setSelectedExp(exp);
                        setIsConfigModalOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                    >
                      Config
                    </button>
                    {exp.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => handleRunExp(exp.id)}
                        className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold"
                      >
                        Run
                      </button>
                    ) : (
                      <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800">
                        Results Ready
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Experiment Modal Form */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Configure New Experiment"
        subtitle="Set simulation horizons, workload parameters, and objective weights"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateExperiment} className="space-y-6 text-xs">
          {/* Section A: Simulation Config */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
              1. Simulation Horizon & Scale
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Experiment Name</label>
                <input
                  type="text"
                  required
                  value={expForm.name}
                  onChange={(e) => setExpForm({ ...expForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Dataset Selection</label>
                <select
                  value={expForm.datasetName}
                  onChange={(e) => setExpForm({ ...expForm, datasetName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="Synthetic-Google-Cluster-v2">Synthetic Google Cluster Sample v2</option>
                  <option value="Alibaba-Trace-Sample-2026">Alibaba Trace Sample (Demo)</option>
                  <option value="Custom-Configured-Workloads">Custom Configured Workloads</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-slate-300 mb-1">Number of Workloads</label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={expForm.numWorkloads}
                  onChange={(e) => setExpForm({ ...expForm, numWorkloads: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Number of Data Centers</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={expForm.numDataCenters}
                  onChange={(e) => setExpForm({ ...expForm, numDataCenters: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Time Slot Duration</label>
                <select
                  value={expForm.timeSlotDuration}
                  onChange={(e) => setExpForm({ ...expForm, timeSlotDuration: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Multi-Objective Weights */}
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
              2. Multi-Objective Scheduling Weights & SLA Limits
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Carbon Weight ({expForm.carbonWeight})</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={expForm.carbonWeight}
                  onChange={(e) => setExpForm({ ...expForm, carbonWeight: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Energy Weight ({expForm.energyWeight})</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={expForm.energyWeight}
                  onChange={(e) => setExpForm({ ...expForm, energyWeight: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Cost Weight ({expForm.costWeight})</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={expForm.costWeight}
                  onChange={(e) => setExpForm({ ...expForm, costWeight: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-md glow-cyan"
            >
              Initialize Experiment
            </button>
          </div>
        </form>
      </Modal>

      {/* View Configuration Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={`Config Spec: ${selectedExp?.id}`}
        subtitle={selectedExp?.name}
      >
        {selectedExp && (
          <div className="space-y-4 text-xs font-mono">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto">
              {JSON.stringify(selectedExp, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
};
