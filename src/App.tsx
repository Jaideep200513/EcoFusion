import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './components/landing/LandingPage';
import { Overview } from './pages/Overview';
import { Workloads } from './pages/Workloads';
import { ResourcePools } from './pages/ResourcePools';
import { SimulationSetup } from './pages/SimulationSetup';
import { Scheduling } from './pages/Scheduling';
import { Experiments } from './pages/Experiments';
import { Results } from './pages/Results';
import { Comparisons } from './pages/Comparisons';
import { Documentation } from './pages/Documentation';
import { Settings } from './pages/Settings';
import type { DashboardTab } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const handleOpenDashboard = (targetTab: DashboardTab = 'overview') => {
    setActiveTab(targetTab);
    setCurrentView('dashboard');
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchWorkspace={() => handleOpenDashboard('overview')}
        onNavigateTab={(tab: DashboardTab) => handleOpenDashboard(tab)}
      />
    );
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onNavigateLanding={() => setCurrentView('landing')}
    >
      {({ latestResult, triggerSimulation, isSimulating }) => {
        switch (activeTab) {
          case 'overview':
            return (
              <Overview
                onNavigateTab={setActiveTab}
                onRunSimulation={triggerSimulation}
                latestResult={latestResult}
                isSimulating={isSimulating}
              />
            );
          case 'workloads':
            return <Workloads />;
          case 'resource-pools':
            return <ResourcePools />;
          case 'simulation-setup':
            return (
              <SimulationSetup
                onRunSimulation={triggerSimulation}
                onNavigateTab={setActiveTab}
                isSimulating={isSimulating}
              />
            );
          case 'scheduling':
            return <Scheduling />;
          case 'experiments':
            return <Experiments />;
          case 'results':
            return <Results />;
          case 'comparisons':
            return <Comparisons />;
          case 'documentation':
            return <Documentation />;
          case 'settings':
          case 'configuration':
            return <Settings />;
          default:
            return (
              <Overview
                onNavigateTab={setActiveTab}
                onRunSimulation={triggerSimulation}
                latestResult={latestResult}
                isSimulating={isSimulating}
              />
            );
        }
      }}
    </AppLayout>
  );
}

export default App;
