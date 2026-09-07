# EcoFusion: AI-Assisted Spatial-Temporal Workload Scheduling Framework

**EcoFusion** is an AI-assisted spatial-temporal workload scheduling and multi-objective optimization simulation framework designed for sustainable cloud computing. It determines **WHERE** (eligible cloud resource pool) and **WHEN** (feasible time slot before deadline) flexible workloads should execute to optimize environmental and operational metrics.

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
│   │   │   ├── routes_experiments.py
│   │   │   ├── routes_prediction.py   # Prediction training & inference routes
│   │   │   └── routes_optimization.py # NSGA-II optimization & benchmark comparison routes
│   │   ├── models/                     # Strongly-typed Pydantic schemas
│   │   │   ├── workload.py
│   │   │   ├── resource_pool.py
│   │   │   ├── simulation.py
│   │   │   ├── scheduling.py
│   │   │   └── experiment.py
│   │   ├── prediction/                 # ML Workload Demand Predictor (Random Forest)
│   │   │   ├── schemas.py              # Prediction I/O schemas
│   │   │   ├── dataset_builder.py      # Synthetic historical trace builder
│   │   │   ├── feature_engineering.py  # Feature preprocessor
│   │   │   ├── model.py                # WorkloadPredictor model wrapper
│   │   │   ├── train.py                # Model training & MAE/RMSE/R² evaluation
│   │   │   └── predict.py              # Inference service
│   │   ├── optimization/               # NSGA-II Multi-Objective Optimizer (pymoo)
│   │   │   ├── schemas.py              # Optimization & Pareto solution schemas
│   │   │   ├── chromosome.py           # Integer gene encoding/decoding
│   │   │   ├── repair.py               # Feasibility-preserving repair operator
│   │   │   ├── problem.py              # EcoFusionSchedulingProblem (3 objectives)
│   │   │   ├── nsga2_optimizer.py      # NSGA-II runner algorithm
│   │   │   └── compromise_selector.py  # Normalized weighted best-compromise selector
│   │   ├── services/                   # Core mathematical & simulation engines
│   │   │   ├── workload_service.py     # Reproducible synthetic workload generator
│   │   │   ├── resource_pool_service.py# Virtualized pool configuration loader
│   │   │   ├── time_slot_service.py    # Discrete 1-hour slot generator
│   │   │   ├── capacity_tracker.py     # Spatial-temporal CPU/RAM tracker
│   │   │   ├── energy_service.py       # IT & PUE energy calculator
│   │   │   ├── carbon_service.py       # Carbon emissions evaluator
│   │   │   ├── cost_service.py         # Electricity cost calculator
│   │   │   ├── sla_service.py          # Deadline compliance evaluator
│   │   │   └── simulation_service.py   # Simulation pipeline orchestrator
│   │   ├── schedulers/                 # Scheduler implementations
│   │   │   ├── base_scheduler.py       # Common scheduler interface
│   │   │   ├── random_scheduler.py     # Random candidate baseline
│   │   │   ├── first_fit_scheduler.py  # First-Fit chronological heuristic
│   │   │   └── optimized_scheduler.py  # NSGA-II, Carbon-Aware, and Energy-Aware schedulers
│   │   └── utils/                      # Seed reproducibility & validators
│   │       ├── random_utils.py
│   │       └── validation.py
│   ├── config/                         # External JSON configurations
│   │   ├── datacenters.json            # Simulated resource pools (Mumbai, Hyderabad, Singapore)
│   │   ├── simulation.json             # Default simulation settings
│   │   └── experiments.json            # Tracking metadata
│   ├── models/artifacts/               # Saved ML predictor artifacts (joblib)
│   ├── results/                        # Persisted experiment run outputs (EXP-XXX)
│   ├── tests/                          # Pytest test suite (35 tests)
│   │   ├── test_models.py
│   │   ├── test_services.py
│   │   ├── test_schedulers.py
│   │   ├── test_pipeline_integration.py
│   │   ├── test_prediction.py
│   │   ├── test_optimization.py
│   │   └── test_pipeline_week4.py
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

### 1. Workload Prediction (Random Forest)
Uses a multi-target Random Forest Regressor (`scikit-learn`) to predict workload CPU cores, RAM requirements, and execution duration from historical arrival patterns, priority levels, and past usage means. Evaluated via MAE, RMSE, and $R^2$ regression metrics.

### 2. Decision Variable Chromosome Encoding
Each chromosome vector represents a candidate schedule for $N$ workloads across $M$ resource pools and $K$ discrete time slots:
$$\text{Gene}_i = \text{Pool\_Index}_i \times K + \text{Time\_Slot\_Index}_i \quad \forall i \in [0, N-1]$$
- $\text{Pool\_Index}_i = \lfloor \text{Gene}_i / K \rfloor$
- $\text{Time\_Slot\_Index}_i = \text{Gene}_i \pmod K$

### 3. Feasibility Repair Operator & Constraint Handling
The custom repair operator (`EcoFusionRepair`) validates every gene for:
1. $\text{Start Time} \ge \text{Arrival Time}$
2. $\text{Completion Time} \le \text{Deadline}$
3. $\text{Completion Time} \le \text{Simulation Horizon}$
4. $\text{Spatial-Temporal Capacity Tracker fit check}$

If violated, the repair operator replaces the gene with the first valid candidate pair $(\text{Pool}', \text{Slot}')$. Unscheduled workloads accrue constraint violation penalties.

### 4. Multi-Objective Optimization Problem Formulations
NSGA-II minimizes three competing objectives simultaneously:
- $F_1 = \text{Total Carbon Emissions (kgCO}_2)$
- $F_2 = \text{Total Energy Consumption (kWh)}$
- $F_3 = \text{Total Operational Cost (USD)}$

Subject to constraint $G_1 = \text{Unscheduled Workloads} \le 0$.

### 5. Best-Compromise Solution Selection
Selection from the non-dominated Pareto front uses normalized weighted objective scoring:
$$\text{Score}(s) = w_{\text{carbon}} \cdot \hat{F}_1(s) + w_{\text{energy}} \cdot \hat{F}_2(s) + w_{\text{cost}} \cdot \hat{F}_3(s) + w_{\text{sla}} \cdot \text{SLA\_Violation\_Rate}(s)$$

---

## Baseline Schedulers Compared

1. **EcoFusion NSGA-II (`ecofusion_nsga2`)**: Multi-objective evolutionary optimization Pareto front.
2. **Carbon-Aware Greedy (`carbon_aware`)**: Priority routing to pools with lowest carbon intensity.
3. **Energy-Aware Greedy (`energy_aware`)**: Priority routing to pools with lowest PUE ratings.
4. **First-Fit Heuristic (`first_fit`)**: Chronological first-available capacity search.
5. **Random Scheduler (`random`)**: Seeded random baseline.

---

## Setup & Running Instructions

### Backend Setup (FastAPI)
```powershell
cd backend

# Install dependencies (scikit-learn, pymoo, joblib, etc.)
python -m pip install -r requirements.txt

# Run pytest test suite (35 unit & integration tests)
pytest tests -v

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API running at: `http://localhost:8000` (Docs at `http://localhost:8000/docs`).

### Frontend Setup (React + Vite)
```powershell
# From project root
npm install
npm run dev
```
Frontend UI running at: `http://localhost:5173`.

---

## Example API Requests

### 1. Train Prediction Model
```http
POST http://localhost:8000/api/prediction/train
Content-Type: application/json

{
  "sample_count": 1000,
  "n_estimators": 100,
  "random_state": 42
}
```

### 2. Execute NSGA-II Optimization
```http
POST http://localhost:8000/api/optimization/run
Content-Type: application/json

{
  "sim_config": {
    "num_workloads": 30,
    "random_seed": 42
  },
  "opt_config": {
    "population_size": 50,
    "generations": 50,
    "enable_prediction": false
  }
}
```

### 3. Fetch Algorithm Benchmark Comparisons
```http
POST http://localhost:8000/api/experiments/compare
Content-Type: application/json

{
  "num_workloads": 30,
  "random_seed": 42
}
```

---

## Current Limitations (Week 4)

- **Synthetic Training Data**: Random Forest predictor uses synthetic historical trace observations.
- **Simulated Resource Pools**: Resource pools are aggregated virtualized representations (Mumbai, Hyderabad, Singapore).
- **Static Environmental Signals**: Carbon intensity and electricity prices are static per pool.
- **Indirect Cooling**: Data center cooling overhead is modeled via PUE.
- **No Host-Level Migration**: Physical server host-level VM migrations are not modeled.

---

## Week 5 Roadmap

- **Dynamic Grid Carbon & Tariff Signals**: Dynamic hourly grid carbon intensity and time-of-use (ToU) electricity tariffs.
- **Advanced Deep Learning Predictors**: Compare Random Forest against LSTM / Transformer architectures.
- **Interactive Pareto Visualizer**: Fine-grained objective weight sliders on the UI.
