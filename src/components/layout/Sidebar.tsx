import React from 'react';
import {
  LayoutDashboard,
  Server,
  Building2,
  Leaf,
  GitBranch,
  FlaskConical,
  BarChart3,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'workloads'
  | 'datacenters'
  | 'carbon-energy'
  | 'scheduling'
  | 'experiments'
  | 'results'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'workloads', label: 'Workloads', icon: <Server className="w-4 h-4" /> },
    { id: 'datacenters', label: 'Data Centers', icon: <Building2 className="w-4 h-4" /> },
    { id: 'carbon-energy', label: 'Carbon & Energy', icon: <Leaf className="w-4 h-4" /> },
    {
      id: 'scheduling',
      label: 'Scheduling (WHERE+WHEN)',
      icon: <GitBranch className="w-4 h-4 text-cyan-400" />,
      badge: 'CORE',
    },
    { id: 'experiments', label: 'Experiments', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'results', label: 'Results', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 bg-slate-950/90 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-cyan-400 text-slate-950 font-extrabold shadow-lg glow-cyan">
            <Zap className="w-5 h-5 fill-current text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                EcoFusion
              </h1>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
              Cloud AI Scheduler
            </p>
          </div>
        </div>

        {/* Research Context Tag */}
        <div className="mx-3 my-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Scope:</span>
            <span className="font-semibold text-cyan-300">WHERE + WHEN</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1">
            <span className="text-slate-400">Stage:</span>
            <span className="font-semibold text-emerald-400">Week 3 Simulator</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 text-cyan-300 border border-cyan-500/30 shadow-md glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">B.Tech Research Project</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
          Spatial-Temporal Workload Scheduling Framework
        </p>
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
          <span>Ver. 0.3.0 (Demo)</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Ready
          </span>
        </div>
      </div>
    </aside>
  );
};
