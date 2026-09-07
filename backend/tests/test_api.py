from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_get_resource_pools_endpoint():
    response = client.get("/api/resource-pools")
    assert response.status_code == 200
    pools = response.json()
    assert len(pools) >= 3
    assert any(p["location"] == "Mumbai" for p in pools)


def test_get_workloads_endpoint():
    response = client.get("/api/workloads?count=10&seed=42")
    assert response.status_code == 200
    workloads = response.json()
    assert len(workloads) == 10


def test_create_workload_endpoint():
    payload = {
        "id": "WL-CUSTOM-999",
        "arrival_time": 1.0,
        "cpu_required": 16.0,
        "memory_required": 64.0,
        "duration": 2.0,
        "deadline": 6.0,
        "priority": 2
    }
    response = client.post("/api/workloads", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == "WL-CUSTOM-999"


def test_get_simulation_config_endpoint():
    response = client.get("/api/simulation/config")
    assert response.status_code == 200
    cfg = response.json()
    assert cfg["random_seed"] == 42
    assert cfg["scheduler_name"] == "random"


def test_run_simulation_endpoint():
    payload = {
        "scheduler_name": "first_fit",
        "num_workloads": 20,
        "random_seed": 100
    }
    response = client.post("/api/simulations/run", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["scheduler_name"] == "first_fit"
    assert result["total_workloads"] == 20
    assert "total_energy_kwh" in result
    assert "total_carbon_kg" in result


def test_get_experiments_endpoint():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    exps = response.json()
    assert isinstance(exps, list)
