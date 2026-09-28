import React, { useState, useEffect } from 'react';
import type { Experiment } from '../types';
import { simulatorService } from '../services/simulatorService';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  FlaskConical,
  Plus,
  Play,
  Trash2,
  Download,
} from 'lucide-react';

export const Experiments: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>(simulatorService.getExperiments());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [runningExpId, setRunningExpId] = useState<string | null>(null);

  // Form state
  const [expForm, setExpForm] = useState({
    name: 'Multi-Objective Pareto Sensitivity Test',
    datasetName: 'Google Cluster Trace v2 (Production)',
    numWorkloads: 24,
    numDataCenters: 3,
    timeSlotDuration: 60,
    algorithm: 'ECOFUSION_NSGA2',
    randomSeed: 101,
    carbonWeight: 0.4,
    energyWeight: 0.3,
    costWeight: 0.3,
    maxSlaViolationRate: 5.0,
  });

  useEffect(() => {
    const unsubscribe = simulatorService.subscribe(() => {
      setExperiments([...simulatorService.getExperiments()]);
    });
    return unsubscribe;
  }, []);

  const handleCreateExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    const created = simulatorService.createExperiment({
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
    setSelectedExp(created);
  };

  const handleRunExp = async (expId: string) => {
    setRunningExpId(expId);
    try {
      simulatorService.runExperiment(expId);
      setExperiments([...simulatorService.getExperiments()]);
    } finally {
      setRunningExpId(null);
    }
  };

  const handleDeleteExp = (expId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Delete experiment ${expId} from archive?`)) {
      simulatorService.deleteExperiment(expId);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(experiments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ecofusion_experiments_archive_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const completedCount = experiments.filter((e) => e.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-slate-950 text-white shadow-sm">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950 tracking-tight">Research Experiment Suite</h3>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-semibold">
                {experiments.length} RUNS
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Configure parameters, calibrate multi-objective weights, and manage reproducible simulation runs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Experiment</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Archive</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold block">Total Experiments</span>
          <span className="text-xl font-bold font-mono text-slate-950 mt-1 block">{experiments.length}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Recorded simulation states</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold block">Completed Runs</span>
          <span className="text-xl font-bold font-mono text-slate-950 mt-1 block">{completedCount}</span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Fully evaluated</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold block">Optimization Algorithm</span>
          <span className="text-xl font-bold font-mono text-slate-950 mt-1 block">NSGA-II</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Non-dominated sorting</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold block">Seed Reproducibility</span>
          <span className="text-xl font-bold font-mono text-slate-950 mt-1 block">Deterministic</span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">100% reproducible</span>
        </div>
      </div>

      {/* Experiments Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-sans border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold">Experiment ID & Name</th>
                <th className="px-4 py-3 font-bold">Trace Dataset</th>
                <th className="px-4 py-3 font-bold">Workloads</th>
                <th className="px-4 py-3 font-bold">Regions</th>
                <th className="px-4 py-3 font-bold">Algorithm</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Carbon (kg)</th>
                <th className="px-4 py-3 font-bold">Cost ($)</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {experiments.map((exp) => (
                <tr
                  key={exp.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedExp(exp);
                    setIsConfigModalOpen(true);
                  }}
                >
                  <td className="px-4 py-3.5 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-bold">
                        {exp.id}
                      </span>
                      <span className="text-slate-950 font-bold group-hover:text-slate-700 transition-colors">
                        {exp.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium truncate max-w-[160px]">{exp.datasetName}</td>
                  <td className="px-4 py-3.5 text-slate-950 font-mono font-bold">{exp.numWorkloads}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-mono">{exp.numDataCenters}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-950 font-bold text-[11px]">{exp.algorithm}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      type="simulation"
                      label={exp.status}
                      status={
                        exp.status === 'COMPLETED'
                          ? 'success'
                          : exp.status === 'RUNNING'
                          ? 'info'
                          : 'neutral'
                      }
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-950">
                    {exp.totalCarbonKg ? `${exp.totalCarbonKg} kg` : '-'}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-950">
                    {exp.totalCostUsd ? `$${exp.totalCostUsd}` : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleRunExp(exp.id)}
                      disabled={runningExpId === exp.id}
                      className="px-2.5 py-1 rounded-md bg-slate-950 text-white font-bold text-[11px] hover:bg-slate-800 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{runningExpId === exp.id ? 'Running...' : 'Run'}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteExp(exp.id, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center"
                      title="Delete Run"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Experiment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Research Experiment"
        subtitle="Configure parameter matrix & multi-objective weights"
      >
        <form onSubmit={handleCreateExperiment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Experiment Name</label>
            <input
              type="text"
              required
              value={expForm.name}
              onChange={(e) => setExpForm({ ...expForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Workload Trace Dataset</label>
              <select
                value={expForm.datasetName}
                onChange={(e) => setExpForm({ ...expForm, datasetName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-950"
              >
                <option value="Google Cluster Trace v2 (Production)">Google Cluster Trace v2</option>
                <option value="Alibaba Cloud GPU & AI Workloads">Alibaba Cloud Trace</option>
                <option value="Azure VM Fleet Workloads (Multi-Regional)">Azure VM Fleet Trace</option>
                <option value="Synthetic Spatial-Temporal Multi-Region">Synthetic Multi-Region</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Algorithm Strategy</label>
              <select
                value={expForm.algorithm}
                onChange={(e) => setExpForm({ ...expForm, algorithm: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-950 font-mono"
              >
                <option value="ECOFUSION_NSGA2">EcoFusion NSGA-II Multi-Objective</option>
                <option value="CARBON_AWARE">Carbon-Aware Heuristic</option>
                <option value="ENERGY_AWARE">Energy-Aware Heuristic</option>
                <option value="FIRST_FIT">First-Fit Chronological</option>
                <option value="RANDOM">Random Placement Baseline</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Workload Count</label>
              <input
                type="number"
                min={4}
                max={500}
                value={expForm.numWorkloads}
                onChange={(e) => setExpForm({ ...expForm, numWorkloads: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Regional Pools</label>
              <input
                type="number"
                min={1}
                max={10}
                value={expForm.numDataCenters}
                onChange={(e) => setExpForm({ ...expForm, numDataCenters: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Random Seed</label>
              <input
                type="number"
                value={expForm.randomSeed}
                onChange={(e) => setExpForm({ ...expForm, randomSeed: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Objective Calibration Weights (Sum = 1.0)</span>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-sans">Carbon ({expForm.carbonWeight})</label>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={expForm.carbonWeight}
                  onChange={(e) => setExpForm({ ...expForm, carbonWeight: Number(e.target.value) })}
                  className="w-full accent-slate-950"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-sans">Energy ({expForm.energyWeight})</label>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={expForm.energyWeight}
                  onChange={(e) => setExpForm({ ...expForm, energyWeight: Number(e.target.value) })}
                  className="w-full accent-slate-950"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-sans">Cost ({expForm.costWeight})</label>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={expForm.costWeight}
                  onChange={(e) => setExpForm({ ...expForm, costWeight: Number(e.target.value) })}
                  className="w-full accent-slate-950"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              Initialize & Queue Experiment
            </button>
          </div>
        </form>
      </Modal>

      {/* View Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={`Experiment Snapshot: ${selectedExp?.id}`}
        subtitle={selectedExp?.name}
      >
        {selectedExp && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 font-sans block">Execution Status:</span>
                <span className="font-bold text-slate-950">{selectedExp.status}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block">Algorithm:</span>
                <span className="font-bold text-slate-950">{selectedExp.algorithm}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block">Trace Ingested:</span>
                <span className="font-bold text-slate-950 font-sans truncate block">{selectedExp.datasetName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block">Deterministic Seed:</span>
                <span className="font-bold text-slate-950">{selectedExp.randomSeed}</span>
              </div>
            </div>

            {selectedExp.totalCarbonKg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 grid grid-cols-3 gap-2 text-xs font-mono text-center">
                <div>
                  <span className="text-emerald-800 font-sans block text-[11px]">Carbon</span>
                  <span className="text-base font-bold text-emerald-950">{selectedExp.totalCarbonKg} kg</span>
                </div>
                <div>
                  <span className="text-emerald-800 font-sans block text-[11px]">Energy</span>
                  <span className="text-base font-bold text-emerald-950">{selectedExp.totalEnergyKwh} kWh</span>
                </div>
                <div>
                  <span className="text-emerald-800 font-sans block text-[11px]">Cost</span>
                  <span className="text-base font-bold text-emerald-950">${selectedExp.totalCostUsd}</span>
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-lg bg-slate-950 text-white font-mono text-xs overflow-x-auto max-h-48">
              <pre>{JSON.stringify(selectedExp.config, null, 2)}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
