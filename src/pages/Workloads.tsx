import React, { useState } from 'react';
import type { Workload } from '../types';
import { simulatorService } from '../services/simulatorService';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Server,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  SlidersHorizontal,
  Cpu,
  HardDrive,
  Zap,
  Leaf,
  DollarSign,
} from 'lucide-react';

export const Workloads: React.FC = () => {
  const [workloads, setWorkloads] = useState<Workload[]>(simulatorService.getWorkloads());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Drawer & Modal state
  const [selectedWorkload, setSelectedWorkload] = useState<Workload | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Workload Form state
  const [newWorkload, setNewWorkload] = useState({
    name: '',
    arrivalTime: '10:00',
    cpuRequired: 32,
    memoryRequired: 128,
    duration: 3,
    deadline: '18:00',
    assignedDcId: 'DC1',
    assignedTimeSlot: '10:00',
  });

  const filteredWorkloads = workloads.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddWorkload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkload.name) return;

    simulatorService.addWorkload({
      name: newWorkload.name,
      arrivalTime: newWorkload.arrivalTime,
      cpuRequired: Number(newWorkload.cpuRequired),
      memoryRequired: Number(newWorkload.memoryRequired),
      duration: Number(newWorkload.duration),
      deadline: newWorkload.deadline,
      assignedDcId: newWorkload.assignedDcId,
      assignedTimeSlot: newWorkload.assignedTimeSlot,
    });

    setWorkloads([...simulatorService.getWorkloads()]);
    setIsAddModalOpen(false);
    setNewWorkload({
      name: '',
      arrivalTime: '10:00',
      cpuRequired: 32,
      memoryRequired: 128,
      duration: 3,
      deadline: '18:00',
      assignedDcId: 'DC1',
      assignedTimeSlot: '10:00',
    });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workloads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ecofusion_workloads_demo_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Workload Registry</h3>
            <p className="text-xs text-slate-400">
              Manage compute tasks, CPU/Memory demands, SLAs, and assigned spatial-temporal slots
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workload</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Dataset</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Workloads</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search workloads by ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Workload Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Workload ID & Name</th>
                <th className="px-4 py-3">Arrival</th>
                <th className="px-4 py-3">CPU (cores)</th>
                <th className="px-4 py-3">Memory (GB)</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">SLA Status</th>
                <th className="px-4 py-3">Assigned DC</th>
                <th className="px-4 py-3">Time Slot</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredWorkloads.map((wl) => (
                <tr
                  key={wl.id}
                  onClick={() => setSelectedWorkload(wl)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                        {wl.id}
                      </span>
                      <span className="text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {wl.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{wl.arrivalTime}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{wl.cpuRequired}</td>
                  <td className="px-4 py-3 text-slate-300">{wl.memoryRequired} GB</td>
                  <td className="px-4 py-3 text-slate-300">{wl.duration} hrs</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{wl.deadline}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      type="sla"
                      label={wl.slaStatus}
                      status={
                        wl.slaStatus === 'COMPLIANT'
                          ? 'success'
                          : wl.slaStatus === 'RISK'
                          ? 'warning'
                          : 'error'
                      }
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-cyan-300">
                    {wl.assignedDcId || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {wl.assignedTimeSlot || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkload(wl);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workload Detail Drawer */}
      <Drawer
        isOpen={!!selectedWorkload}
        onClose={() => setSelectedWorkload(null)}
        title={`Workload Details: ${selectedWorkload?.id}`}
        subtitle={selectedWorkload?.name}
      >
        {selectedWorkload && (
          <div className="space-y-6">
            {/* Status Header */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Execution Status:</span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {selectedWorkload.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">SLA Margin Feasibility:</span>
                <StatusBadge
                  type="sla"
                  label={selectedWorkload.slaStatus}
                  status={selectedWorkload.slaStatus === 'COMPLIANT' ? 'success' : 'warning'}
                  size="sm"
                />
              </div>
            </div>

            {/* Resource Demands */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Resource Requirements
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CPU Cores</span>
                  </div>
                  <p className="text-base font-bold text-slate-100">{selectedWorkload.cpuRequired} cores</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Memory</span>
                  </div>
                  <p className="text-base font-bold text-slate-100">{selectedWorkload.memoryRequired} GB</p>
                </div>
              </div>
            </div>

            {/* Time Window */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Timing Constraints (WHEN)
              </h4>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Arrival Time:</span>
                  <span className="font-mono text-slate-200">{selectedWorkload.arrivalTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Execution Duration:</span>
                  <span className="font-mono text-slate-200">{selectedWorkload.duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SLA Deadline:</span>
                  <span className="font-mono text-rose-400">{selectedWorkload.deadline}</span>
                </div>
              </div>
            </div>

            {/* Sustainability Impact Estimates */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Estimated Impact (Demo Simulation)
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-300">Energy Consumption:</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {(selectedWorkload.cpuRequired * selectedWorkload.duration * 1.25).toFixed(1)} kWh
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300">Carbon Footprint:</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-300 text-sm">
                    {(selectedWorkload.cpuRequired * selectedWorkload.duration * 385 / 1000).toFixed(2)} kgCO₂
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-300">Operational Cost:</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    ${(selectedWorkload.cpuRequired * selectedWorkload.duration * 0.12).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Dataset Import Placeholder Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Dataset Ingestion Workspace"
        subtitle="Week 4 Roadmap Preview"
      >
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-100">
              Dataset ingestion will be connected in the next implementation phase.
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              We are currently in Week 3 (Methodology & Simulator foundation). Real trace datasets (Google Cluster Data / Alibaba Cloud traces) will be hooked directly to the workload engine during Week 4.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Formats:</span>
              <span className="font-mono text-cyan-300">CSV, Parquet, JSON</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ML Workload Predictor:</span>
              <span className="text-amber-400">LSTM / Prophet (Week 4)</span>
            </div>
          </div>

          <button
            onClick={() => setIsImportModalOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md"
          >
            Acknowledge & Close
          </button>
        </div>
      </Modal>

      {/* Add Workload Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Demo Workload"
        subtitle="Specify resource parameters & SLA constraints"
      >
        <form onSubmit={handleAddWorkload} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Workload Name</label>
            <input
              type="text"
              required
              placeholder="e.g., BERT Model Fine-Tuning"
              value={newWorkload.name}
              onChange={(e) => setNewWorkload({ ...newWorkload, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">CPU Required (Cores)</label>
              <input
                type="number"
                min={1}
                max={512}
                value={newWorkload.cpuRequired}
                onChange={(e) => setNewWorkload({ ...newWorkload, cpuRequired: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Memory (GB)</label>
              <input
                type="number"
                min={1}
                max={2048}
                value={newWorkload.memoryRequired}
                onChange={(e) => setNewWorkload({ ...newWorkload, memoryRequired: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Arrival Time</label>
              <input
                type="text"
                value={newWorkload.arrivalTime}
                onChange={(e) => setNewWorkload({ ...newWorkload, arrivalTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Duration (Hours)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={newWorkload.duration}
                onChange={(e) => setNewWorkload({ ...newWorkload, duration: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Deadline</label>
              <input
                type="text"
                value={newWorkload.deadline}
                onChange={(e) => setNewWorkload({ ...newWorkload, deadline: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold shadow-md glow-cyan"
            >
              Register Workload
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
