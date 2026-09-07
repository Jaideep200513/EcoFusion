from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import routes_workloads, routes_resource_pools, routes_simulations, routes_experiments

app = FastAPI(
    title="EcoFusion Simulation Engine API",
    description="AI-Assisted Spatial-Temporal Workload Scheduling Simulator for Sustainable Cloud Computing",
    version="0.3.0",
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


@app.get("/health", tags=["Health"])
def health_check():
    """
    Simulator backend health check endpoint.
    """
    return {
        "status": "ok",
        "service": "EcoFusion Simulation Engine Backend",
        "version": "0.3.0",
        "simulation_mode": "METHODOLOGY_AND_SIMULATOR_BASELINE",
    }
