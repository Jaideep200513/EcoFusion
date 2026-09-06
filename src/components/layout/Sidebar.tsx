import React, { useState } from 'react';
import {
  LayoutDashboard,
  Server,
  Building2,
  Sliders,
  GitBranch,
  FlaskConical,
  BarChart3,
  Layers,
  BookOpen,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import type { DashboardTab } from '../../types';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  onNavigateLanding?: () => void;
}

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onNavigateLanding,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const groups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'WORKSPACE',
      items: [
        {
          id: 'workloads',
          label: 'Workloads',
          icon: <Server className="w-4 h-4" />,
        },
        {
          id: 'resource-pools',
          label: 'Resource Pools',
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          id: 'simulation-setup',
          label: 'Simulation Setup',
          icon: <Sliders className="w-4 h-4" />,
        },
        {
          id: 'scheduling',
          label: 'Scheduling (WHERE+WHEN)',
          icon: <GitBranch className="w-4 h-4" />,
          badge: 'CORE',
        },
      ],
    },
    {
      title: 'RESEARCH',
      items: [
        {
          id: 'experiments',
          label: 'Experiments',
          icon: <FlaskConical className="w-4 h-4" />,
        },
        {
          id: 'results',
          label: 'Results Analysis',
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          id: 'comparisons',
          label: 'Comparisons',
          icon: <Layers className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'REFERENCE',
      items: [
        {
          id: 'documentation',
          label: 'Documentation',
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-screen transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-950 leading-tight">EcoFusion</h1>
                <p className="text-xs text-slate-500 font-sans tracking-wider font-bold">RESEARCH LAB</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 hover:text-black transition-all cursor-pointer shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Back to Public Site Link */}
        {onNavigateLanding && !collapsed && (
          <div className="px-3 pt-3">
            <button
              onClick={onNavigateLanding}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Landing Page</span>
            </button>
          </div>
        )}

        {/* Grouped Navigation */}
        <div className="px-3 py-3 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'justify-between px-3'
                    } py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-950 text-white font-bold shadow-md'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span
                        className={`text-[10px] font-sans px-1.5 py-0.5 rounded font-extrabold uppercase ${
                          isActive
                            ? 'bg-white text-slate-950'
                            : 'bg-slate-100 text-slate-950 border border-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 text-xs bg-slate-50">
        {collapsed ? (
          <div className="flex justify-center py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950" title="System Ready" />
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-900">Simulation Engine</div>
              <div className="text-xs text-slate-500 font-mono font-medium">v0.3.2 · NSGA-II</div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" title="Online" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
