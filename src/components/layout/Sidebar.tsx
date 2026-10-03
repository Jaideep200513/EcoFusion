import React, { useState } from 'react';
import {
  LayoutDashboard,
  Server,
  SlidersHorizontal,
  PlayCircle,
  BarChart3,
  GitCompare,
  MoreHorizontal,
  Settings,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  Zap,
} from 'lucide-react';
import type { DashboardTab } from '../../types';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  onNavigateLanding?: () => void;
}

const primary = [
  { id: 'overview' as DashboardTab, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workloads' as DashboardTab, label: 'Workloads', icon: Server },
  { id: 'simulation-setup' as DashboardTab, label: 'Setup', icon: SlidersHorizontal },
  { id: 'scheduling' as DashboardTab, label: 'Run Scheduler', icon: PlayCircle },
  { id: 'results' as DashboardTab, label: 'Results', icon: BarChart3 },
  { id: 'comparisons' as DashboardTab, label: 'Compare', icon: GitCompare },
];

const advanced = [
  { id: 'resource-pools' as DashboardTab, label: 'Resource Pools' },
  { id: 'experiments' as DashboardTab, label: 'Experiments' },
  { id: 'documentation' as DashboardTab, label: 'Documentation' },
  { id: 'settings' as DashboardTab, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onNavigateLanding }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <aside className={`shrink-0 min-h-screen border-r border-slate-200 bg-white flex flex-col transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-[230px]'}`}>
      <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
        <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2.5 min-w-0 cursor-pointer">
          <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Zap className="w-4 h-4 fill-current" />
          </span>
          {!collapsed && <span className="text-base font-extrabold tracking-tight text-slate-950">EcoFusion</span>}
        </button>
        <button onClick={() => setCollapsed(v => !v)} className="hidden lg:block text-slate-400 hover:text-slate-800 cursor-pointer text-xs">
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && <p className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Workspace</p>}
        {primary.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'} ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}

        <div className="pt-3">
          <button
            onClick={() => setShowAdvanced(v => !v)}
            title={collapsed ? 'More' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          >
            <MoreHorizontal className="w-[18px] h-[18px] text-slate-400" />
            {!collapsed && <><span className="flex-1 text-left">More</span><ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /></>}
          </button>
          {showAdvanced && !collapsed && (
            <div className="mt-1 ml-3 pl-3 border-l border-slate-200 space-y-0.5">
              {advanced.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${activeTab === item.id ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        {onNavigateLanding && (
          <button onClick={onNavigateLanding} title={collapsed ? 'Landing page' : undefined} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
            <ArrowLeft className="w-4 h-4" />
            {!collapsed && 'Landing page'}
          </button>
        )}
        {!collapsed && <div className="px-3 pt-2 text-[11px] text-slate-400">Simulation engine ready</div>}
      </div>
    </aside>
  );
};

export default Sidebar;
