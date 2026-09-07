from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import (
    routes_workloads,
    routes_resource_pools,
    routes_simulations,
    routes_experiments,
    routes_prediction,
    routes_optimization,
)

app = FastAPI(
    title="EcoFusion Simulation & Optimization Engine API",
    description="AI-Assisted Spatial-Temporal Workload Scheduling & NSGA-II Multi-Objective Optimizer for Sustainable Cloud Computing",
    version="0.4.0",
)

# Enable CORS for React frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(routes_workloads.router)
app.include_router(routes_resource_pools.router)
app.include_router(routes_simulations.router)
app.include_router(routes_experiments.router)
app.include_router(routes_prediction.router)
app.include_router(routes_optimization.router)


@app.get("/health", tags=["Health"])
def health_check():
    """
    Simulator & NSGA-II Optimizer backend health check endpoint.
    """
    return {
        "status": "ok",
        "service": "EcoFusion Engine Backend",
        "version": "0.4.0",
        "simulation_mode": "PREDICTION_AND_NSGA2_OPTIMIZATION",
    }
