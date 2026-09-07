import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { simulatorService } from '../../services/simulatorService';
import type { DashboardTab, SimulationResult } from '../../types';

interface AppLayoutProps {
  onNavigateLanding?: () => void;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  children: (props: {
    activeTab: DashboardTab;
    setActiveTab: (tab: DashboardTab) => void;
    latestResult: SimulationResult | null;
    triggerSimulation: () => void;
    isSimulating: boolean;
  }) => React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  onNavigateLanding,
  activeTab: controlledTab,
  onTabChange,
  children,
}) => {
  const [internalTab, setInternalTab] = useState<DashboardTab>('overview');
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestResult, setLatestResult] = useState<SimulationResult | null>(null);

  const activeTab = controlledTab || internalTab;
  const setActiveTab = (tab: DashboardTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await simulatorService.runAsyncSimulation();
      setLatestResult(res);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F5F0] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNavigateLanding={onNavigateLanding}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onRunSimulation={handleRunSimulation}
          isSimulating={isSimulating}
          onNavigateLanding={onNavigateLanding}
          onNavigateTab={setActiveTab}
        />

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {children({
            activeTab,
            setActiveTab,
            latestResult,
            triggerSimulation: handleRunSimulation,
            isSimulating,
          })}
        </main>
      </div>
    </div>
  );
};
