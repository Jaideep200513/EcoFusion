import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { ActiveTab } from './Sidebar';
import { Header } from './Header';
import { StatusBanner } from '../common/StatusBanner';
import { initialSystemStatus } from '../../data/mockData';
import { simulatorService } from '../../services/simulatorService';
import type { SimulationResult } from '../../types';

interface AppLayoutProps {
  children: (props: {
    activeTab: ActiveTab;
    latestResult: SimulationResult | null;
    triggerSimulation: () => void;
  }) => React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestResult, setLatestResult] = useState<SimulationResult | null>(null);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = simulatorService.runDemoSimulation();
      setLatestResult(res);
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="flex min-h-screen bg-[#070a11] text-slate-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onRunSimulation={handleRunSimulation}
          isSimulating={isSimulating}
          lastSimTime={latestResult?.timestamp}
        />

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <StatusBanner status={initialSystemStatus} />
          {children({ activeTab, latestResult, triggerSimulation: handleRunSimulation })}
        </main>
      </div>
    </div>
  );
};
