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

export const AppLayout: React.FC<AppLayoutProps> = ({ onNavigateLanding, activeTab: controlledTab, onTabChange, children }) => {
  const [internalTab, setInternalTab] = useState<DashboardTab>('overview');
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestResult, setLatestResult] = useState<SimulationResult | null>(() => simulatorService.getLatestResult());

  React.useEffect(() => simulatorService.subscribe(() => setLatestResult(simulatorService.getLatestResult())), []);

  const activeTab = controlledTab || internalTab;
  const setActiveTab = (tab: DashboardTab) => onTabChange ? onTabChange(tab) : setInternalTab(tab);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const setup = simulatorService.getSimulationSetupConfig();
      const simConfig = simulatorService.getSimulationConfig();
      const res = await simulatorService.runAsyncSimulation({
        ...simConfig,
        numWorkloads: setup.numWorkloads,
        algorithm: setup.algorithm,
        randomSeed: setup.randomSeed,
      });
      setLatestResult(res);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onNavigateLanding={onNavigateLanding} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header activeTab={activeTab} onRunSimulation={handleRunSimulation} isSimulating={isSimulating} onNavigateLanding={onNavigateLanding} onNavigateTab={setActiveTab} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {children({ activeTab, setActiveTab, latestResult, triggerSimulation: handleRunSimulation, isSimulating })}
          </div>
        </main>
      </div>
    </div>
  );
};
