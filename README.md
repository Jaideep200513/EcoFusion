# EcoFusion: Multi-Parameter AI Spatial-Temporal Cloud Scheduling Framework

**EcoFusion** is an AI-assisted spatial-temporal workload scheduling and multi-objective optimization simulation platform designed for sustainable cloud computing and data centers.

---

## 🎯 The Core Problem & Project Innovation

Traditional cloud data centers rely on **single-parameter heuristic algorithms** that optimize only one dimension in isolation:
* **Carbon-Aware Algorithm**: Minimizes strictly carbon emissions ($\min \text{Carbon}$), but blindly routes workloads to regions with expensive green power tariffs and ignores server PUE cooling overhead.
* **Energy-Aware Algorithm**: Minimizes strictly facility kilowatt-hours ($\min \text{Energy}$ / PUE), but frequently routes workloads to dirty coal-powered grids if their PUE happens to be low.
* **Cost-Aware Algorithm**: Minimizes strictly electricity bills ($\min \text{Cost}$ / Tariff), shifting computation to cheap off-peak fossil fuel power.
* **EDF / Latency-Aware Algorithm**: Rushes workloads to meet deadlines ($\min \text{Latency}$), wasting execution slack hours where clean solar/wind power is abundant.

### The EcoFusion Solution
EcoFusion formulates cloud scheduling as a **Multi-Objective Spatial-Temporal Optimization Problem (NSGA-II)** that simultaneously co-optimizes:
$$\min \mathbf{F}(\mathbf{x}) = \begin{bmatrix} F_1(\mathbf{x}) = \text{Carbon Footprint (kg CO}_2\text{e)} \\ F_2(\mathbf{x}) = \text{Facility Energy Consumption (kWh)} \\ F_3(\mathbf{x}) = \text{Operational Electricity Cost (USD)} \\ F_4(\mathbf{x}) = \text{SLA & Latency Violations} \end{bmatrix}$$

This produces empirical, mathematical evidence demonstrating how EcoFusion achieves near-optimal performance across **all metrics at once**, outperforming single-parameter algorithms that suffer severe trade-off blindspots.

---

## 🚀 How to Run the Project

### Prerequisites
Before running, ensure you have the following installed on your machine:
* **Node.js** (v18.0 or higher) & `npm`
* **Python** (v3.10, 3.11, 3.12, or 3.13) & `pip`
* **Git** (optional, for version control)

---

### Step 1: Clone or Open the Workspace

Open your terminal or PowerShell and navigate to the project directory:
```bash
cd "c:\VSCODE PROJECTS\EcoFusion"
```

---

### Step 2: Set Up and Run the Backend (FastAPI)

1. Open a terminal and navigate to the `backend` folder:
   ```powershell
   cd backend
   ```

2. (Optional but recommended) Create and activate a Python virtual environment:
   ```powershell
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages (including `pymoo`, `fastapi`, `openpyxl`, `pandas`, `scikit-learn`):
   ```powershell
   python -m pip install -r requirements.txt
   ```

4. Run the backend test suite to verify all schedulers and Excel loaders:
   ```powershell
   pytest tests/test_excel_and_schedulers.py -v
   ```

5. Start the FastAPI development server:
   ```powershell
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

* Backend REST API will be running at: **`http://localhost:8000`**
* Interactive Swagger API Documentation: **`http://localhost:8000/docs`**

---

### Step 3: Set Up and Run the Frontend (React + Vite + TypeScript)

1. Open a **new / second terminal** in the project root:
   ```powershell
   cd "c:\VSCODE PROJECTS\EcoFusion"
   ```

2. Install frontend dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite local development server:
   ```powershell
   npm run dev
   ```

* The frontend application will be running at: **`http://localhost:5173`**
* Open your browser and navigate to `http://localhost:5173` to view the application.

---

### Step 4: Quick-Run Both in Parallel (Single PowerShell Window)

If you prefer to start both backend and frontend from one command in Windows PowerShell:
```powershell
# From project root:
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --reload --port 8000"
npm run dev
```

---

## 📊 Using the Excel Dataset Import & Benchmark Features

### 1. Download Standardized Excel Template
* In the UI, navigate to the **Workloads** page (`http://localhost:5173/workloads`).
* Click **"Download Excel Template"** to receive `ecofusion_workload_template.xlsx`.
* The template includes:
  * **DataDictionary Sheet**: Detailed column descriptions, units, allowed bounds, and descriptions.
  * **WorkloadDataset Sheet**: 12 pre-configured, high-precision diverse workloads (AI training, batch genomics, web tier, streaming pipelines).

### 2. High-Precision Excel Import (`.xlsx` / `.xls`)
* Click **"Import Dataset"** on the Workloads page.
* Drag and drop your `.xlsx` or `.xls` file.
* Review the **Pre-Import Precision Summary** showing:
  * Total Cores requested
  * Total RAM (GB)
  * Mean execution duration (hours)
  * Average deadline slack time (hours)
  * Live 5-row dataset preview table
* Click **"Confirm & Import"** to load the dataset into the scheduling engine.

### 3. Compare Single-Parameter vs. Multi-Parameter Algorithms
* Navigate to the **Comparisons** page (`http://localhost:5173/comparisons`).
* Click **"Re-Run Benchmark"** to trigger live simulations across all 7 algorithms:
  1. **EcoFusion NSGA-II** *(Multi-Parameter Co-Optimization)*
  2. **Carbon-Aware Scheduler** *(Single-Parameter: Grid CO₂)*
  3. **Energy-Aware Scheduler** *(Single-Parameter: Facility PUE / kWh)*
  4. **Cost-Aware Scheduler** *(Single-Parameter: Electricity Tariffs)*
  5. **EDF Scheduler** *(Single-Parameter: Deadline / Latency)*
  6. **First-Fit FIFO** *(Queue baseline)*
  7. **Random Baseline** *(Stochastic baseline)*
* View the **Numerical Evidence Ledger** cards highlighting exact percentage gains (Carbon reduction, Energy savings, Cost savings, and SLA compliance) vs each single-parameter heuristic.
* Click **"Export Excel"** to download the complete comparison table as an `.xlsx` workbook.

---

## 📐 Mathematical Formulation Reference

### 1. Facility Energy Consumption
$$E_{\text{total}} = \sum_{i=1}^N \frac{P(u_i) \times d_i \times \text{PUE}(p_i, t_{\text{start}, i})}{1000} \quad [\text{kWh}]$$
$$\text{where } P(u) = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}}) \times u_{\text{cpu}}$$

### 2. Grid Carbon Emissions
$$C_{\text{total}} = \sum_{i=1}^N \frac{E_{\text{total}}(i) \times \text{CI}(p_i, t_{\text{start}, i})}{1000} \quad [\text{kg CO}_2\text{e}]$$

### 3. Operational Electricity Cost
$$\text{Cost}_{\text{total}} = \sum_{i=1}^N E_{\text{total}}(i) \times \text{Tariff}(p_i, t_{\text{start}, i}) \quad [\text{USD}]$$

### 4. Multi-Criteria Composite Efficiency Score
$$\text{Efficiency Score} = \left( 1 - \frac{\|\mathbf{F}(\mathbf{x}) - \mathbf{z}^*\|_2}{\|\mathbf{z}_{\text{nadir}} - \mathbf{z}^*\|_2} \right) \times 100$$
*(Measures closeness to the theoretical Utopia point $\mathbf{z}^*$ across all dimensions).*

---

## 📂 Project Architecture

```
EcoFusion/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry point & CORS
│   │   ├── api/                        # REST API routes
│   │   │   ├── routes_workloads.py     # Excel upload (.xlsx/.xls), template, export
│   │   │   ├── routes_experiments.py   # Multi-algorithm benchmark comparison
│   │   │   ├── routes_optimization.py  # NSGA-II Pareto optimization
│   │   │   ├── routes_simulations.py   # Simulation execution & history
│   │   │   └── routes_prediction.py    # Random Forest workload predictor
│   │   ├── schedulers/                 # Algorithm implementations
│   │   │   ├── optimized_scheduler.py  # Carbon-Aware, Energy-Aware, Cost-Aware, EDF, NSGA-II
│   │   │   ├── first_fit_scheduler.py  # First-Fit baseline
│   │   │   └── random_scheduler.py     # Random baseline
│   │   ├── services/
│   │   │   ├── workload_service.py     # Excel parser & workload generator
│   │   │   ├── capacity_tracker.py     # 2D spatial-temporal CPU/RAM tracker
│   │   │   ├── energy_service.py       # PUE & server power calculator
│   │   │   ├── carbon_service.py       # Regional grid emissions evaluator
│   │   │   └── cost_service.py         # Dynamic tariff calculator
│   │   └── models/                     # Pydantic schemas
│   ├── tests/                          # Automated Pytest test suite
│   ├── config/                         # Data center pool configs (Mumbai, Hyderabad, Singapore)
│   └── requirements.txt                # Python dependencies (openpyxl, pymoo, fastapi, pandas)
├── src/                                # React + Vite + TypeScript Frontend
│   ├── pages/
│   │   ├── Workloads.tsx               # Excel import modal & template download
│   │   ├── Comparisons.tsx             # Multi vs Single parameter numerical evidence
│   │   ├── Experiments.tsx             # Experiment runner
│   │   ├── Simulation.tsx              # Timeline visualizer
│   │   └── Overview.tsx                # Dashboard summary
│   ├── services/
│   │   ├── simulatorService.ts         # In-browser fallback engine & Excel parser
│   │   └── apiClient.ts                # Backend API connector
│   └── types/                          # TypeScript interfaces
├── package.json
└── README.md
```

---

## 🧪 Testing and Verification

### Backend Verification
```powershell
cd backend
python -m pytest tests/test_excel_and_schedulers.py -v
```

### Frontend Build Verification
```powershell
npm run build
```

---

## 🛠️ Troubleshooting

* **Backend `ModuleNotFoundError: No module named 'openpyxl'`**:
  Make sure you ran `pip install -r requirements.txt` in the python environment being used.
* **Port 8000 already in use**:
  Run uvicorn on another port with `--port 8080`, and update `VITE_API_URL` if needed.
* **Excel sheet format error**:
  Ensure the imported file has `.xlsx` or `.xls` extension and contains required columns (`name`, `cpu_cores`, `ram_gb`, `duration_hours`, `arrival_time`, `deadline`). You can use the downloadable template as a standard reference.
