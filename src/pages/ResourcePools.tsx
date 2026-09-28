import React, { useState, useEffect } from 'react';
import type { ResourcePool } from '../types';
import { simulatorService } from '../services/simulatorService';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import {
  Building2,
  MapPin,
  Server,
  Leaf,
  DollarSign,
  Plus,
  Power,
  Trash2,
  Edit2,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ResourcePools: React.FC = () => {
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>(simulatorService.getResourcePools());
  const [selectedPool, setSelectedPool] = useState<ResourcePool | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPool, setEditPool] = useState<ResourcePool | null>(null);

  const [newPool, setNewPool] = useState({
    name: '',
    locationLabel: '',
    region: '',
    cpuCapacity: 2048,
    memoryCapacity: 8192,
    pue: 1.2,
    idlePowerKw: 45.0,
    maxPowerKw: 200.0,
    carbonIntensity: 450,
    electricityPrice: 0.12,
    availability: 99.95,
  });

  useEffect(() => {
    const unsubscribe = simulatorService.subscribe(() => {
      setResourcePools([...simulatorService.getResourcePools()]);
    });
    return unsubscribe;
  }, []);

  const totalCores = resourcePools.reduce((acc, p) => acc + p.cpuCapacity, 0);
  const totalMemory = resourcePools.reduce((acc, p) => acc + p.memoryCapacity, 0);
  const avgPue = (resourcePools.reduce((acc, p) => acc + p.pue, 0) / (resourcePools.length || 1)).toFixed(2);

  const handleAddPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPool.locationLabel) return;

    const created = simulatorService.addResourcePool({
      name: newPool.name || `${newPool.locationLabel} Cloud Facility`,
      locationLabel: newPool.locationLabel,
      region: newPool.region || `${newPool.locationLabel}-DC1`,
      cpuCapacity: Number(newPool.cpuCapacity),
      memoryCapacity: Number(newPool.memoryCapacity),
      pue: Number(newPool.pue),
      idlePowerKw: Number(newPool.idlePowerKw),
      maxPowerKw: Number(newPool.maxPowerKw),
      carbonIntensity: Number(newPool.carbonIntensity),
      electricityPrice: Number(newPool.electricityPrice),
      availability: Number(newPool.availability),
      status: 'ONLINE',
    });

    setSelectedPool(created);
    setIsAddModalOpen(false);
    setNewPool({
      name: '',
      locationLabel: '',
      region: '',
      cpuCapacity: 2048,
      memoryCapacity: 8192,
      pue: 1.2,
      idlePowerKw: 45.0,
      maxPowerKw: 200.0,
      carbonIntensity: 450,
      electricityPrice: 0.12,
      availability: 99.95,
    });
  };

  const handleEditPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPool) return;

    simulatorService.updateResourcePool(editPool.id, {
      name: editPool.name,
      locationLabel: editPool.locationLabel,
      region: editPool.region,
      cpuCapacity: Number(editPool.cpuCapacity),
      memoryCapacity: Number(editPool.memoryCapacity),
      pue: Number(editPool.pue),
      idlePowerKw: Number(editPool.idlePowerKw),
      maxPowerKw: Number(editPool.maxPowerKw),
      carbonIntensity: Number(editPool.carbonIntensity),
      electricityPrice: Number(editPool.electricityPrice),
    });

    setSelectedPool({ ...editPool });
    setIsEditModalOpen(false);
  };

  const handleToggleStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = simulatorService.togglePoolStatus(id);
    if (selectedPool?.id === id && updated) {
      setSelectedPool({ ...updated });
    }
  };

  const handleDeletePool = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Remove resource pool ${id}?`)) {
      simulatorService.deleteResourcePool(id);
      if (selectedPool?.id === id) {
        setSelectedPool(null);
      }
    }
  };

  // Hourly carbon & price forecast curves for drawer view
  const hourlyProfileData = [
    { hour: '00:00', carbon: Math.round((selectedPool?.carbonIntensity || 450) * 1.05), price: Number(((selectedPool?.electricityPrice || 0.12) * 0.8).toFixed(3)) },
    { hour: '04:00', carbon: Math.round((selectedPool?.carbonIntensity || 450) * 1.0), price: Number(((selectedPool?.electricityPrice || 0.12) * 0.75).toFixed(3)) },
    { hour: '08:00', carbon: Math.round((selectedPool?.carbonIntensity || 450) * 1.15), price: Number(((selectedPool?.electricityPrice || 0.12) * 1.1).toFixed(3)) },
    { hour: '12:00', carbon: Math.round((selectedPool?.carbonIntensity || 450) * 0.72), price: Number(((selectedPool?.electricityPrice || 0.12) * 1.25).toFixed(3)) },
    { hour: '16:00', carbon: Math.round((selectedPool?.carbonIntensity || 450) * 1.2), price: Number(((selectedPool?.electricityPrice || 0.12) * 1.4).toFixed(3)) },
    { hour: '20:00', carbon: Math.round((selectedPool?.carbonIntensity || 450) * 1.1), price: Number(((selectedPool?.electricityPrice || 0.12) * 1.15).toFixed(3)) },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-slate-950 text-white shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950 tracking-tight">Regional Resource Pools</h3>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-semibold">
                {resourcePools.length} REGIONS
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Geographically distributed compute pools with localized PUE, grid emission factors, and time-of-use tariffs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Regional Pool</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Pooled Compute Cores</span>
            <Server className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-xl font-mono font-extrabold text-slate-950">{totalCores.toLocaleString()} Cores</div>
          <p className="text-[11px] text-slate-500 mt-1">Multi-region capacity</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Pooled Memory</span>
            <Activity className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-xl font-mono font-extrabold text-slate-950">{(totalMemory / 1024).toFixed(1)} TB RAM</div>
          <p className="text-[11px] text-slate-500 mt-1">Total hardware buffers</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Average PUE</span>
            <Zap className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-xl font-mono font-extrabold text-slate-950">{avgPue}</div>
          <p className="text-[11px] text-slate-500 mt-1">Facility cooling factor</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Operational Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono font-extrabold text-slate-950">
            {resourcePools.filter((p) => p.status === 'ONLINE').length} / {resourcePools.length} Online
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Ready for scheduling</p>
        </div>
      </div>

      {/* Cards Grid for Resource Pools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resourcePools.map((pool) => (
          <div
            key={pool.id}
            onClick={() => setSelectedPool(pool)}
            className="p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-400 shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
          >
            {/* Pool Header */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    {pool.id}
                  </span>
                  <h4 className="text-lg font-bold text-slate-950 mt-2.5 group-hover:text-slate-700 transition-colors">
                    {pool.name}
                  </h4>
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-900" />
                    {pool.locationLabel} · <span className="font-mono text-xs text-slate-500 font-semibold">{pool.region}</span>
                  </p>
                </div>
                <button
                  onClick={(e) => handleToggleStatus(pool.id, e)}
                  title="Toggle Status"
                  className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md border font-bold cursor-pointer transition-colors ${
                    pool.status === 'ONLINE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${pool.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {pool.status}
                </button>
              </div>

              {/* Hardware Capacity Specs */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block font-bold font-sans">Compute Capacity</span>
                  <span className="font-bold text-slate-950">{pool.cpuCapacity} Cores</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block font-bold font-sans">Memory Pool</span>
                  <span className="font-bold text-slate-950">{pool.memoryCapacity} GB</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500 text-[10px] uppercase block font-bold font-sans">Facility PUE</span>
                  <span className="font-bold text-slate-950">{pool.pue}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500 text-[10px] uppercase block font-bold font-sans">Power Curve</span>
                  <span className="font-bold text-slate-800">{pool.idlePowerKw} - {pool.maxPowerKw} kW</span>
                </div>
              </div>

              {/* Dynamic Utilization Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600 font-semibold font-sans">Current Core Utilization:</span>
                  <span className="font-bold text-slate-950">{pool.currentUtilization}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-slate-950 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, pool.currentUtilization))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Environmental & Cost Footprint */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-950">{pool.carbonIntensity}</span>
                <span className="text-slate-500 text-[11px] font-sans">gCO₂/kWh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-900" />
                <span className="font-bold text-slate-950">${pool.electricityPrice}</span>
                <span className="text-slate-500 text-[11px] font-sans">/kWh</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resource Pool Detail Drawer */}
      <Drawer
        isOpen={!!selectedPool}
        onClose={() => setSelectedPool(null)}
        title={`Facility Profile: ${selectedPool?.id}`}
        subtitle={`${selectedPool?.name} (${selectedPool?.region})`}
      >
        {selectedPool && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase font-sans">Operational State</span>
                <p className="text-sm font-bold text-slate-950 font-mono mt-0.5">{selectedPool.status}</p>
              </div>
              <button
                onClick={() => handleToggleStatus(selectedPool.id)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Toggle Status</span>
              </button>
            </div>

            {/* Capacity Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-sans">
                Infrastructure Envelope
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-sans block">Total CPU Nodes</span>
                  <span className="text-base font-bold text-slate-950">{selectedPool.cpuCapacity} Cores</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-sans block">RAM Capacity</span>
                  <span className="text-base font-bold text-slate-950">{selectedPool.memoryCapacity} GB</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-sans block">Cooling Overhead PUE</span>
                  <span className="text-base font-bold text-slate-950">{selectedPool.pue}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-sans block">Active Workloads</span>
                  <span className="text-base font-bold text-slate-950">{selectedPool.activeWorkloadsCount || 0} scheduled</span>
                </div>
              </div>
            </div>

            {/* 24-Hour Carbon and Price Forecast Curves */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-sans">
                Grid Carbon Dynamics (gCO₂/kWh)
              </h4>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyProfileData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#0f172a',
                      }}
                    />
                    <Line type="monotone" dataKey="carbon" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="Carbon (gCO₂/kWh)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setEditPool(selectedPool);
                  setIsEditModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Parameters</span>
              </button>
              {resourcePools.length > 1 && (
                <button
                  onClick={() => handleDeletePool(selectedPool.id)}
                  className="px-4 py-2.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Pool Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Regional Resource Pool"
        subtitle="Provision a regional cloud data center node"
      >
        <form onSubmit={handleAddPool} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Frankfurt Green Compute Campus"
              value={newPool.name}
              onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Frankfurt"
                value={newPool.locationLabel}
                onChange={(e) => setNewPool({ ...newPool, locationLabel: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Region Identifier</label>
              <input
                type="text"
                placeholder="e.g. EU-Central-1"
                value={newPool.region}
                onChange={(e) => setNewPool({ ...newPool, region: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CPU Cores Capacity</label>
              <input
                type="number"
                min={256}
                step={256}
                value={newPool.cpuCapacity}
                onChange={(e) => setNewPool({ ...newPool, cpuCapacity: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">RAM Capacity (GB)</label>
              <input
                type="number"
                min={1024}
                step={512}
                value={newPool.memoryCapacity}
                onChange={(e) => setNewPool({ ...newPool, memoryCapacity: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PUE Factor</label>
              <input
                type="number"
                step="0.01"
                min="1.05"
                max="2.0"
                value={newPool.pue}
                onChange={(e) => setNewPool({ ...newPool, pue: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Carbon (gCO₂/kWh)</label>
              <input
                type="number"
                value={newPool.carbonIntensity}
                onChange={(e) => setNewPool({ ...newPool, carbonIntensity: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price ($/kWh)</label>
              <input
                type="number"
                step="0.01"
                value={newPool.electricityPrice}
                onChange={(e) => setNewPool({ ...newPool, electricityPrice: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              Provision Regional Resource Pool
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Pool Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Facility: ${editPool?.id}`}
        subtitle="Calibrate PUE, power ratings, and localized emissions"
      >
        {editPool && (
          <form onSubmit={handleEditPool} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name</label>
              <input
                type="text"
                required
                value={editPool.name}
                onChange={(e) => setEditPool({ ...editPool, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CPU Capacity</label>
                <input
                  type="number"
                  value={editPool.cpuCapacity}
                  onChange={(e) => setEditPool({ ...editPool, cpuCapacity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">RAM Capacity (GB)</label>
                <input
                  type="number"
                  value={editPool.memoryCapacity}
                  onChange={(e) => setEditPool({ ...editPool, memoryCapacity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PUE</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPool.pue}
                  onChange={(e) => setEditPool({ ...editPool, pue: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Carbon (gCO₂/kWh)</label>
                <input
                  type="number"
                  value={editPool.carbonIntensity}
                  onChange={(e) => setEditPool({ ...editPool, carbonIntensity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price ($/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPool.electricityPrice}
                  onChange={(e) => setEditPool({ ...editPool, electricityPrice: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                Save Facility Parameters
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
