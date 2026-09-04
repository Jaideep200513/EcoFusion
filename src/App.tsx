import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Workloads } from './pages/Workloads';
import { DataCenters } from './pages/DataCenters';
import { CarbonEnergy } from './pages/CarbonEnergy';
import { Scheduling } from './pages/Scheduling';
import { Experiments } from './pages/Experiments';
import { Results } from './pages/Results';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <AppLayout>
      {({ activeTab, triggerSimulation }) => {
        switch (activeTab) {
          case 'dashboard':
            return (
              <Dashboard
                onNavigateTab={() => {}}
                onRunSimulation={triggerSimulation}
              />
            );
          case 'workloads':
            return <Workloads />;
          case 'datacenters':
            return <DataCenters />;
          case 'carbon-energy':
            return <CarbonEnergy />;
          case 'scheduling':
            return <Scheduling />;
          case 'experiments':
            return <Experiments />;
          case 'results':
            return <Results />;
          case 'settings':
            return <Settings />;
          default:
            return <Dashboard onNavigateTab={() => {}} onRunSimulation={triggerSimulation} />;
        }
      }}
    </AppLayout>
  );
}

export default App;
