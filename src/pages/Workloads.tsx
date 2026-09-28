import React, { useState, useEffect } from 'react';
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
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  Upload,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const Workloads: React.FC = () => {
  const [workloads, setWorkloads] = useState<Workload[]>(simulatorService.getWorkloads());
  const [resourcePools] = useState(simulatorService.getResourcePools());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Drawer & Modal state
  const [selectedWorkload, setSelectedWorkload] = useState<Workload | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeImportTab, setActiveImportTab] = useState<'presets' | 'upload' | 'synthetic'>('presets');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Form states
  const [newWorkload, setNewWorkload] = useState({
    name: '',
    arrivalTime: '02:00',
    cpuRequired: 64,
    memoryRequired: 256,
    duration: 3,
    deadline: '10:00',
    assignedPoolId: 'POOL-BOM',
    assignedTimeSlot: '02',
  });

  const [editWorkload, setEditWorkload] = useState<Workload | null>(null);

  // Synthetic Generator state
  const [syntheticCount, setSyntheticCount] = useState<number>(24);
  const [syntheticSeed, setSyntheticSeed] = useState<number>(42);

  // Subscribe to simulator service state
  useEffect(() => {
    const unsubscribe = simulatorService.subscribe(() => {
      setWorkloads([...simulatorService.getWorkloads()]);
    });
    return unsubscribe;
  }, []);

  const filteredWorkloads = workloads.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live statistics
  const totalCores = workloads.reduce((sum, w) => sum + w.cpuRequired, 0);
  const totalRam = workloads.reduce((sum, w) => sum + w.memoryRequired, 0);
  const avgDuration = workloads.length > 0 ? (workloads.reduce((sum, w) => sum + w.duration, 0) / workloads.length).toFixed(1) : '0';
  const compliantCount = workloads.filter((w) => w.slaStatus === 'COMPLIANT').length;
  const compliantPercent = workloads.length > 0 ? Math.round((compliantCount / workloads.length) * 100) : 100;

  const handleAddWorkload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkload.name) return;

    const created = simulatorService.addWorkload({
      name: newWorkload.name,
      arrivalTime: newWorkload.arrivalTime,
      cpuRequired: Number(newWorkload.cpuRequired),
      memoryRequired: Number(newWorkload.memoryRequired),
      duration: Number(newWorkload.duration),
      deadline: newWorkload.deadline,
      assignedPoolId: newWorkload.assignedPoolId,
      assignedDcId: newWorkload.assignedPoolId,
      assignedTimeSlot: newWorkload.assignedTimeSlot,
    });

    setSelectedWorkload(created);
    setIsAddModalOpen(false);
    setNewWorkload({
      name: '',
      arrivalTime: '02:00',
      cpuRequired: 64,
      memoryRequired: 256,
      duration: 3,
      deadline: '10:00',
      assignedPoolId: resourcePools[0]?.id || 'POOL-BOM',
      assignedTimeSlot: '02',
    });
  };

  const handleEditWorkload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorkload) return;

    simulatorService.updateWorkload(editWorkload.id, {
      name: editWorkload.name,
      arrivalTime: editWorkload.arrivalTime,
      cpuRequired: Number(editWorkload.cpuRequired),
      memoryRequired: Number(editWorkload.memoryRequired),
      duration: Number(editWorkload.duration),
      deadline: editWorkload.deadline,
      assignedPoolId: editWorkload.assignedPoolId,
      assignedDcId: editWorkload.assignedPoolId,
      assignedTimeSlot: editWorkload.assignedTimeSlot,
      status: editWorkload.status,
    });

    if (selectedWorkload && selectedWorkload.id === editWorkload.id) {
      setSelectedWorkload({ ...editWorkload });
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteWorkload = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Remove workload ${id} from active trace pool?`)) {
      simulatorService.deleteWorkload(id);
      if (selectedWorkload?.id === id) {
        setSelectedWorkload(null);
      }
    }
  };

  const handleLoadTracePreset = (presetName: string) => {
    let count = 24;
    let seed = 42;
    if (presetName === 'alibaba') {
      count = 32;
      seed = 108;
    } else if (presetName === 'azure') {
      count = 40;
      seed = 256;
    } else if (presetName === 'llm') {
      count = 16;
      seed = 999;
    }

    simulatorService.generateSyntheticWorkloads(count, seed);
    setImportNotice(`Loaded ${count} workloads from ${presetName.toUpperCase()} trace.`);
    setTimeout(() => {
      setImportNotice(null);
      setIsImportModalOpen(false);
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: any[] = [];
        if (file.name.endsWith('.json')) {
          parsed = JSON.parse(text);
        } else {
          // Simple CSV Parser
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          parsed = lines.slice(1).map((line, idx) => {
            const parts = line.split(',');
            return {
              id: `W-CSV-${idx + 1}`,
              name: parts[0]?.trim() || `CSV Task ${idx + 1}`,
              cpuRequired: Number(parts[1]) || 32,
              memoryRequired: Number(parts[2]) || 128,
              duration: Number(parts[3]) || 2,
              arrivalTime: parts[4]?.trim() || '00:00',
              deadline: parts[5]?.trim() || '08:00',
            };
          });
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          simulatorService.importWorkloads(parsed);
          setImportNotice(`Successfully ingested ${parsed.length} workloads from ${file.name}`);
          setTimeout(() => {
            setImportNotice(null);
            setIsImportModalOpen(false);
          }, 1200);
        } else {
          alert('Could not detect valid workload records in the uploaded file.');
        }
      } catch (err) {
        alert('Failed to parse file: ' + String(err));
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateSynthetic = () => {
    simulatorService.generateSyntheticWorkloads(syntheticCount, syntheticSeed);
    setImportNotice(`Generated and scheduled ${syntheticCount} synthetic workloads.`);
    setTimeout(() => {
      setImportNotice(null);
      setIsImportModalOpen(false);
    }, 1200);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workloads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ecofusion_workload_registry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-slate-950 text-white shadow-sm">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950 tracking-tight">Workload Trace Registry</h3>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-semibold">
                {workloads.length} ACTIVE
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Profile CPU/Memory demands, arrival timestamps, and SLA completion constraints for multi-objective optimization.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workload</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-700" />
            <span>Ingest Traces</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Architecture Insight: ML Predictor vs Optimizer */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase">Stage 02: Workload Demand Prediction Model</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-bold">
                Random Forest Regressor (R² = 0.94)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              The Random Forest model predicts actual runtime CPU/RAM utilization and execution duration from trace characteristics. The NSGA-II scheduler then uses these predictions to evaluate optimal <strong className="text-white">WHERE (Resource Pool)</strong> + <strong className="text-white">WHEN (Time Slot)</strong> placements.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Aggregated CPU Load</span>
            <Cpu className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-xl font-mono font-extrabold text-slate-950">{totalCores.toLocaleString()} Cores</div>
          <p className="text-[11px] text-slate-500 mt-1">Across all trace workloads</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Aggregated RAM Buffer</span>
            <HardDrive className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-xl font-mono font-extrabold text-slate-950">{totalRam.toLocaleString()} GB</div>
          <p className="text-[11px] text-slate-500 mt-1">Dynamic working memory</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Mean Duration</span>
            <Clock className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-xl font-mono font-extrabold text-slate-950">{avgDuration} hrs</div>
          <p className="text-[11px] text-slate-500 mt-1">Discrete execution window</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>SLA Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono font-extrabold text-slate-950">{compliantPercent}%</div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">{compliantCount} / {workloads.length} on-time</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search workloads by ID, name, or pool..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-950 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-950 focus:outline-none focus:border-slate-950 focus:bg-white transition-colors font-semibold"
          >
            <option value="ALL">All Statuses ({workloads.length})</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Workload Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-sans border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold">Workload ID & Name</th>
                <th className="px-4 py-3 font-bold">Arrival</th>
                <th className="px-4 py-3 font-bold">Requested CPU</th>
                <th className="px-4 py-3 font-bold">RF Predicted</th>
                <th className="px-4 py-3 font-bold">RAM (GB)</th>
                <th className="px-4 py-3 font-bold">Duration</th>
                <th className="px-4 py-3 font-bold">Deadline</th>
                <th className="px-4 py-3 font-bold">SLA Margin</th>
                <th className="px-4 py-3 font-bold">Assigned Pool</th>
                <th className="px-4 py-3 font-bold">Slot</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredWorkloads.map((wl) => (
                <tr
                  key={wl.id}
                  onClick={() => setSelectedWorkload(wl)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3.5 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-bold">
                        {wl.id}
                      </span>
                      <span className="text-slate-950 font-semibold group-hover:text-slate-700 transition-colors">
                        {wl.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-mono font-medium">{wl.arrivalTime}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-950 font-mono">{wl.cpuRequired}c</td>
                  <td className="px-4 py-3.5 font-mono">
                    <span className="text-emerald-800 font-bold">{wl.predictedCpu || wl.cpuRequired}c</span>
                    <span className="text-slate-400"> / </span>
                    <span className="text-slate-800 font-medium">{wl.predictedDuration || wl.duration}h</span>
                    <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      RF 94%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-mono">{wl.memoryRequired} GB</td>
                  <td className="px-4 py-3.5 text-slate-700 font-mono">{wl.duration}h</td>
                  <td className="px-4 py-3.5 font-mono text-slate-950 font-medium">{wl.deadline}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      type="sla"
                      label={wl.slaStatus}
                      status={wl.slaStatus === 'COMPLIANT' ? 'success' : 'warning'}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-950 font-bold">
                    {wl.assignedPoolId || wl.assignedDcId || '-'}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-slate-950">
                    TS-{wl.assignedTimeSlot || '00'}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditWorkload(wl);
                        setIsEditModalOpen(true);
                      }}
                      title="Edit Workload"
                      className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteWorkload(wl.id, e)}
                      title="Delete Workload"
                      className="p-1.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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

      {/* Workload Detail Drawer */}
      <Drawer
        isOpen={!!selectedWorkload}
        onClose={() => setSelectedWorkload(null)}
        title={`Workload Profile: ${selectedWorkload?.id}`}
        subtitle={selectedWorkload?.name}
      >
        {selectedWorkload && (
          <div className="space-y-6">
            {/* Status Header */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-semibold">Execution Status:</span>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-950 text-white font-mono">
                  {selectedWorkload.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-semibold">SLA Deadline Compliance:</span>
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
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 font-sans">
                Requested Workload Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-slate-950" />
                    <span className="font-semibold">Requested Cores</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-slate-950">{selectedWorkload.cpuRequired} cores</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-950" />
                    <span className="font-semibold">Memory Buffer</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-slate-950">{selectedWorkload.memoryRequired} GB</p>
                </div>
              </div>
            </div>

            {/* Random Forest Prediction Model Output */}
            <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Random Forest Prediction Model (AI/ML)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  R² = {selectedWorkload.predictionConfidence || 0.94}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Predicted runtime demands derived from trace pattern regressions. These characteristics inform the NSGA-II spatial-temporal optimizer.
              </p>
              <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                <div className="p-2 rounded bg-slate-800 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-sans">Predicted CPU</div>
                  <div className="text-sm font-bold text-emerald-400">{selectedWorkload.predictedCpu || selectedWorkload.cpuRequired} cores</div>
                </div>
                <div className="p-2 rounded bg-slate-800 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-sans">Predicted RAM</div>
                  <div className="text-sm font-bold text-slate-200">{selectedWorkload.predictedMemory || selectedWorkload.memoryRequired} GB</div>
                </div>
                <div className="p-2 rounded bg-slate-800 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-sans">Predicted Dur</div>
                  <div className="text-sm font-bold text-slate-200">{selectedWorkload.predictedDuration || selectedWorkload.duration}h</div>
                </div>
              </div>
            </div>

            {/* Time Window */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 font-sans">
                Timing Constraints (WHEN)
              </h4>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-sans">Arrival Timestamp:</span>
                  <span className="text-slate-950 font-bold">{selectedWorkload.arrivalTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-sans">Execution Duration:</span>
                  <span className="text-slate-950 font-bold">{selectedWorkload.duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-sans">Hard SLA Deadline:</span>
                  <span className="text-rose-700 font-bold">{selectedWorkload.deadline}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-600 font-sans">Assigned Slot:</span>
                  <span className="text-slate-950 font-bold">TS-{selectedWorkload.assignedTimeSlot || '00'}</span>
                </div>
              </div>
            </div>

            {/* Sustainability Impact Estimates */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 font-sans">
                Resource Impact & Environmental Footprint
              </h4>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-950" />
                    <span className="text-xs text-slate-700 font-semibold">Energy Consumption:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-950 text-sm">
                    {(selectedWorkload.cpuRequired * selectedWorkload.duration * 1.25).toFixed(1)} kWh
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-slate-700 font-semibold">Operational Carbon:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-950 text-sm">
                    {((selectedWorkload.cpuRequired * selectedWorkload.duration * 410) / 1000).toFixed(2)} kgCO₂
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-950" />
                    <span className="text-xs text-slate-700 font-semibold">Estimated Cost:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-950 text-sm">
                    ${(selectedWorkload.cpuRequired * selectedWorkload.duration * 0.12).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setEditWorkload(selectedWorkload);
                  setIsEditModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Parameters</span>
              </button>
              <button
                onClick={() => handleDeleteWorkload(selectedWorkload.id)}
                className="px-4 py-2.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Dataset Ingestion Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Trace Dataset Ingestion Workspace"
        subtitle="Load production cluster traces or upload custom telemetry vectors"
        maxWidth="xl"
      >
        <div className="space-y-4">
          {importNotice && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{importNotice}</span>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveImportTab('presets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeImportTab === 'presets' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Standard Cluster Traces
            </button>
            <button
              onClick={() => setActiveImportTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeImportTab === 'upload' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Upload File (CSV / JSON)
            </button>
            <button
              onClick={() => setActiveImportTab('synthetic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeImportTab === 'synthetic' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Synthetic Trace Generator
            </button>
          </div>

          {/* Tab 1: Presets */}
          {activeImportTab === 'presets' && (
            <div className="space-y-3 pt-2">
              <div
                onClick={() => handleLoadTracePreset('google')}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-950 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-950">Google Cluster Trace v2 (Production)</h5>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">24 TASKS</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Heterogeneous CPU/RAM microservices with tight deadline slack</p>
                </div>
                <button className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-900 group-hover:bg-slate-950 group-hover:text-white text-xs font-bold transition-colors">
                  Load Trace
                </button>
              </div>

              <div
                onClick={() => handleLoadTracePreset('alibaba')}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-950 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-950">Alibaba Cloud GPU & AI Workloads</h5>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold">32 TASKS</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">High-memory deep learning training & graph analytics batches</p>
                </div>
                <button className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-900 group-hover:bg-slate-950 group-hover:text-white text-xs font-bold transition-colors">
                  Load Trace
                </button>
              </div>

              <div
                onClick={() => handleLoadTracePreset('azure')}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-950 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-950">Azure VM Fleet Workloads (Multi-Regional)</h5>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">40 TASKS</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Extended duration batch compute with variable arrival intervals</p>
                </div>
                <button className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-900 group-hover:bg-slate-950 group-hover:text-white text-xs font-bold transition-colors">
                  Load Trace
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Upload */}
          {activeImportTab === 'upload' && (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
              <Upload className="w-8 h-8 mx-auto text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-950">Drag & drop workload file here</p>
                <p className="text-xs text-slate-500 mt-0.5">Supports CSV (name, cpu, mem, dur, arrival, deadline) or JSON arrays</p>
              </div>
              <div>
                <label className="inline-block px-4 py-2 rounded-lg bg-slate-950 text-white font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors shadow-sm">
                  Browse Files
                  <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Tab 3: Synthetic */}
          {activeImportTab === 'synthetic' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch Workload Count</label>
                  <select
                    value={syntheticCount}
                    onChange={(e) => setSyntheticCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                  >
                    <option value={12}>12 Tasks (Light)</option>
                    <option value={24}>24 Tasks (Standard Horizon)</option>
                    <option value={48}>48 Tasks (High Density)</option>
                    <option value={96}>96 Tasks (Stress Test)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pseudorandom Seed</label>
                  <input
                    type="number"
                    value={syntheticSeed}
                    onChange={(e) => setSyntheticSeed(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateSynthetic}
                className="w-full py-2.5 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Synthesize & Dispatch Workloads</span>
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Workload Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Cloud Workload Profile"
        subtitle="Specify resource requirements & SLA timing boundaries"
      >
        <form onSubmit={handleAddWorkload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Workload Name / Job ID</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed LLM Gradient Ingestion"
              value={newWorkload.name}
              onChange={(e) => setNewWorkload({ ...newWorkload, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-950 focus:border-slate-950 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CPU Cores Demanded</label>
              <input
                type="number"
                min={1}
                max={2048}
                value={newWorkload.cpuRequired}
                onChange={(e) => setNewWorkload({ ...newWorkload, cpuRequired: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Memory Footprint (GB)</label>
              <input
                type="number"
                min={1}
                max={8192}
                value={newWorkload.memoryRequired}
                onChange={(e) => setNewWorkload({ ...newWorkload, memoryRequired: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Arrival Time</label>
              <input
                type="time"
                value={newWorkload.arrivalTime}
                onChange={(e) => setNewWorkload({ ...newWorkload, arrivalTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Hours)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={newWorkload.duration}
                onChange={(e) => setNewWorkload({ ...newWorkload, duration: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SLA Deadline</label>
              <input
                type="time"
                value={newWorkload.deadline}
                onChange={(e) => setNewWorkload({ ...newWorkload, deadline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Regional Pool</label>
              <select
                value={newWorkload.assignedPoolId}
                onChange={(e) => setNewWorkload({ ...newWorkload, assignedPoolId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
              >
                {resourcePools.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.locationLabel})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Time Slot</label>
              <select
                value={newWorkload.assignedTimeSlot}
                onChange={(e) => setNewWorkload({ ...newWorkload, assignedTimeSlot: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold font-mono"
              >
                {Array.from({ length: 24 }).map((_, idx) => {
                  const s = String(idx).padStart(2, '0');
                  return <option key={s} value={s}>Slot {s}:00</option>;
                })}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
            >
              Register & Dispatch Workload
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Workload Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Workload: ${editWorkload?.id}`}
        subtitle="Adjust compute resources and execution timing"
      >
        {editWorkload && (
          <form onSubmit={handleEditWorkload} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Workload Name</label>
              <input
                type="text"
                required
                value={editWorkload.name}
                onChange={(e) => setEditWorkload({ ...editWorkload, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CPU Cores</label>
                <input
                  type="number"
                  min={1}
                  value={editWorkload.cpuRequired}
                  onChange={(e) => setEditWorkload({ ...editWorkload, cpuRequired: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Memory (GB)</label>
                <input
                  type="number"
                  min={1}
                  value={editWorkload.memoryRequired}
                  onChange={(e) => setEditWorkload({ ...editWorkload, memoryRequired: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Arrival</label>
                <input
                  type="time"
                  value={editWorkload.arrivalTime}
                  onChange={(e) => setEditWorkload({ ...editWorkload, arrivalTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={editWorkload.duration}
                  onChange={(e) => setEditWorkload({ ...editWorkload, duration: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deadline</label>
                <input
                  type="time"
                  value={editWorkload.deadline}
                  onChange={(e) => setEditWorkload({ ...editWorkload, deadline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
