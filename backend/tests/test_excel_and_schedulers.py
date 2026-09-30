import pytest
from app.schedulers import get_scheduler, SCHEDULERS
from app.services.workload_service import generate_workload_excel_template, load_workloads_from_excel
from app.models.simulation import SimulationConfig
from app.models.resource_pool import ResourcePool
from app.services.time_slot_service import generate_time_slots
from app.models.scheduling import SchedulingStatus


def test_excel_template_generation_and_loading():
    excel_bytes = generate_workload_excel_template()
    assert len(excel_bytes) > 0
    workloads = load_workloads_from_excel(excel_bytes)
    assert len(workloads) == 12
    w0 = workloads[0]
    assert w0.id == "WL-001"
    assert w0.cpu_required == 128.0
    assert w0.memory_required == 512.0
    assert w0.duration == 4.5
    assert w0.deadline == 8.0
    assert w0.priority == 3


def test_all_single_parameter_schedulers():
    cfg = SimulationConfig(num_workloads=10, random_seed=42)
    pools = [
        ResourcePool(
            id="pool-1",
            location="Mumbai",
            cpu_capacity=512.0,
            memory_capacity=2048.0,
            pue=1.2,
            idle_power=50.0,
            max_power=200.0,
            carbon_intensity=600.0,
            electricity_price=0.12,
        ),
        ResourcePool(
            id="pool-2",
            location="Hyderabad",
            cpu_capacity=512.0,
            memory_capacity=2048.0,
            pue=1.1,
            idle_power=40.0,
            max_power=180.0,
            carbon_intensity=400.0,
            electricity_price=0.08,
        ),
    ]
    slots = generate_time_slots(cfg)
    workloads = load_workloads_from_excel(generate_workload_excel_template())

    for algo_name in ["carbon_aware", "energy_aware", "cost_aware", "edf"]:
        scheduler = get_scheduler(algo_name)
        assert scheduler is not None
        decisions = scheduler.schedule(workloads, pools, slots, cfg)
        assert len(decisions) == len(workloads)
        scheduled = [d for d in decisions if d.status == SchedulingStatus.SCHEDULED]
        assert len(scheduled) > 0


def test_api_upload_excel_and_compare():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # 1. Download template
    res_template = client.get("/api/workloads/template")
    assert res_template.status_code == 200
    assert len(res_template.content) > 0

    # 2. Upload template back via /api/workloads/upload
    files = {
        "file": ("test_workloads.xlsx", res_template.content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
    res_upload = client.post("/api/workloads/upload", files=files)
    assert res_upload.status_code == 200
    data = res_upload.json()
    assert data["total_imported"] == 12
    assert data["file_type"] == "Excel (.xlsx/.xls)"

    # 3. Export as Excel
    res_export = client.get("/api/workloads/export/excel")
    assert res_export.status_code == 200
    assert len(res_export.content) > 0
