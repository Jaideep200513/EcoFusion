# EcoFusion: AI-Assisted Spatial-Temporal Workload Scheduling Framework

**EcoFusion** is an AI-assisted spatial-temporal workload scheduling simulation framework designed for sustainable cloud computing. It determines **WHERE** (eligible cloud resource pool) and **WHEN** (feasible time slot before deadline) flexible workloads should execute to optimize environmental and operational metrics.

---

## Architecture Overview

```
EcoFusion/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry point & CORS
│   │   ├── api/                        # REST API endpoint routes
│   │   │   ├── routes_workloads.py
│   │   │   ├── routes_resource_pools.py
│   │   │   ├── routes_simulations.py
│   │   │   └── routes_experiments.py
│   │   ├── models/                     # Strongly-typed Pydantic schemas
│   │   │   ├── workload.py
│   │   │   ├── resource_pool.py
│   │   │   ├── simulation.py
│   │   │   ├── scheduling.py
│   │   │   └── experiment.py
│   │   ├── services/                   # Core mathematical & simulation engines
│   │   │   ├── workload_service.py     # Synthetic generator & CSV I/O
│   │   │   ├── resource_pool_service.py# Virtualized pool configuration loader
│   │   │   ├── time_slot_service.py    # Discrete 1-hour slot generator
│   │   │   ├── capacity_tracker.py     # Spatial-temporal CPU/RAM tracker
│   │   │   ├── energy_service.py       # IT & PUE energy calculator
│   │   │   ├── carbon_service.py       # Carbon emissions evaluator
│   │   │   ├── cost_service.py         # Electricity cost calculator
│   │   │   ├── sla_service.py          # Deadline compliance evaluator
│   │   │   └── simulation_service.py   # Simulation pipeline orchestrator
│   │   ├── schedulers/                 # Baseline scheduler implementations
│   │   │   ├── base_scheduler.py       # Common scheduler interface
│   │   │   ├── random_scheduler.py     # Random candidate baseline
│   │   │   └── first_fit_scheduler.py  # First-Fit chronological heuristic
│   │   └── utils/                      # Seed reproducibility & validators
│   │       ├── random_utils.py
│   │       └── validation.py
│   ├── config/                         # External JSON configurations
│   │   ├── datacenters.json            # Simulated resource pools (Mumbai, Hyderabad, Singapore)
│   │   ├── simulation.json             # Default simulation settings
│   │   └── experiments.json            # Tracking metadata
│   ├── results/                        # Persisted experiment runs (EXP-XXX)
│   ├── tests/                          # Pytest unit & integration test suite
│   ├── pytest.ini                      # Pytest execution configuration
│   └── requirements.txt                # Python dependencies
├── src/                                # Vite + React + TypeScript Frontend
│   ├── components/                     # Modern UI components
│   ├── pages/                          # Workspace view pages
│   ├── services/                       # API client & local simulator service fallback
│   └── types/                          # Shared TypeScript interfaces
├── package.json
└── README.md
```

---

## Methodology & Mathematical Models

### 1. Resource Pool Abstraction
Data centers are represented as virtualized aggregated resource pools characterized by:
- $\text{CPU Capacity}$ (cores) & $\text{Memory Capacity}$ (GB)
- $\text{PUE}$ (Power Usage Effectiveness, $\ge 1.0$)
- $\text{Idle Power}$ ($P_{\text{idle}}$, kW) & $\text{Max Power}$ ($P_{\text{max}}$, kW)
- $\text{Carbon Intensity}$ ($I_{\text{carbon}}$, $\text{gCO}_2/\text{kWh}$)
- $\text{Electricity Price}$ ($C_{\text{price}}$, $\$/\text{kWh}$)

### 2. Energy Consumption Model
For a given resource pool in a time slot with active CPU usage $U_{\text{cpu}}$:
$$\text{Utilization} = \min\left(1.0, \frac{U_{\text{cpu}}}{\text{CPU Capacity}}\right)$$
$$P_{\text{total\_kw}} = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}}) \times \text{Utilization}$$
$$E_{\text{IT}} = P_{\text{total\_kw}} \times \Delta t_{\text{hours}}$$
$$E_{\text{facility\_total}} = E_{\text{IT}} \times \text{PUE}$$

For workload-level accounting, the facility energy consumed during occupied slots is allocated proportionally according to the workload's CPU share.

### 3. Carbon Emissions Model
$$\text{Carbon}_{\text{kg}} = \frac{E_{\text{facility\_total}} \times I_{\text{carbon}}}{1000.0}$$

### 4. Operational Electricity Cost Model
$$\text{Cost}_{\text{USD}} = E_{\text{facility\_total}} \times C_{\text{price}}$$

### 5. SLA Compliance Model
A workload satisfies its SLA if and only if its completion time does not exceed its deadline:
$$\text{SLA Met} = (\text{Completion Time} \le \text{Deadline})$$
$$\text{SLA Violation Rate (\%)} = \frac{\text{SLA Violations} + \text{Unscheduled Workloads}}{\text{Total Workloads Submitted}} \times 100.0$$

---

## Baseline Schedulers

1. **Random Scheduler (`random`)**:
   - Randomly shuffles all candidate combinations of eligible resource pools and feasible time slots.
   - Selects a valid candidate that respects arrival time, deadline, CPU capacity, and Memory capacity.
   - Uses the configured random seed for 100% reproducible execution.
   - Explicitly records unscheduled workloads when no candidate can fit.

2. **First-Fit Scheduler (`first_fit`)**:
   - Iterates through resource pools in configuration order (Mumbai $\to$ Hyderabad $\to$ Singapore).
   - Iterates through feasible time slots chronologically.
   - Selects the first feasible candidate that meets all resource and deadline constraints.

---

## Setup & Running Instructions

### Prerequisites
- Python 3.11+ (Python 3.13 supported)
- Node.js 18+ & npm

### Backend Setup (FastAPI)
```powershell
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run unit and integration tests
pytest tests -v

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### Frontend Setup (React + Vite)
```powershell
# From the project root
npm install

# Start Vite dev server
npm run dev
```
Frontend UI will be accessible at: `http://localhost:5173`.

---

## Example API Requests

### 1. Health Check
```http
GET http://localhost:8000/health
```

### 2. Fetch Resource Pools
```http
GET http://localhost:8000/api/resource-pools
```

### 3. Run Simulation
```http
POST http://localhost:8000/api/simulations/run
Content-Type: application/json

{
  "scheduler_name": "first_fit",
  "num_workloads": 100,
  "random_seed": 42,
  "simulation_start": 0,
  "simulation_end": 24,
  "slot_duration_minutes": 60
}
```

### 4. Fetch Saved Experiments
```http
GET http://localhost:8000/api/experiments
```

---

## Current Limitations (Week 3)

- **Synthetic Workload Traces**: Workload instances are synthetically generated or loaded from CSV.
- **Simulated Resource Pools**: Resource pools are aggregated virtualized representations (Mumbai, Hyderabad, Singapore) rather than live cloud provider infrastructure.
- **Static Environmental Signals**: Carbon intensity and electricity prices are static per pool; dynamic time-varying signals will be added in future iterations.
- **Indirect Cooling**: Data center cooling overhead is modeled via PUE rather than detailed thermodynamic simulation.
- **Machine Learning & NSGA-II**: Workload prediction models and multi-objective evolutionary algorithms are deferred to Week 4.

---

## Week 4 Roadmap

- **Workload Demand Forecasting**: Integrate LSTM / Transformer models for temporal workload arrival prediction.
- **NSGA-II Multi-Objective Optimizer**: Implement NSGA-II evolutionary algorithm for non-dominated Pareto front trade-offs (Carbon vs. Cost vs. SLA).
- **Time-Varying Grid Signals**: Integrate hourly dynamic carbon intensity and dynamic time-of-use tariffs.
- **Advanced Baseline Benchmarking**: Compare NSGA-II against Carbon-Aware Greedy, Energy-Aware Greedy, and Round-Robin policies.
