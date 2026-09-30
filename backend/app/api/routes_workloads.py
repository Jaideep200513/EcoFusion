import io
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Response
from pydantic import BaseModel
import pandas as pd

from ..models.workload import Workload, WorkloadCreate
from ..models.simulation import SimulationConfig
from ..services.workload_service import (
    generate_workloads,
    load_workloads_from_excel,
    load_workloads_from_csv,
    parse_workload_dataframe,
    generate_workload_excel_template,
)

router = APIRouter(prefix="/api/workloads", tags=["Workloads"])

# In-memory session workload cache
_cached_workloads: List[Workload] = []


class WorkloadImportSummary(BaseModel):
    total_imported: int
    filename: str
    file_type: str
    total_cpu_cores: float
    total_memory_gb: float
    avg_duration_hours: float
    workloads: List[Workload]


def get_current_workloads(count: int = 100, seed: int = 42) -> List[Workload]:
    global _cached_workloads
    if not _cached_workloads:
        _cached_workloads = generate_workloads(count=count, seed=seed)
    return _cached_workloads


@router.get("", response_model=List[Workload])
def get_workloads(count: int = 100, seed: int = 42):
    """
    Get current set of workloads (or generate synthetic workload trace).
    """
    return get_current_workloads(count=count, seed=seed)


@router.post("", response_model=Workload, status_code=201)
def create_workload(payload: WorkloadCreate):
    """
    Submit a custom workload definition.
    """
    global _cached_workloads
    workloads = get_current_workloads()
    
    new_id = payload.id or f"WL-{len(workloads) + 1:03d}"
    if any(w.id == new_id for w in workloads):
        raise HTTPException(status_code=400, detail=f"Workload ID '{new_id}' already exists.")

    wl = Workload(
        id=new_id,
        arrival_time=payload.arrival_time,
        cpu_required=payload.cpu_required,
        memory_required=payload.memory_required,
        duration=payload.duration,
        deadline=payload.deadline,
        priority=payload.priority,
    )

    _cached_workloads.insert(0, wl)
    return wl


@router.post("/batch", response_model=List[Workload], status_code=201)
def set_workloads_batch(payload: List[Workload]):
    """
    Directly set/replace the active workload trace.
    """
    global _cached_workloads
    _cached_workloads = payload
    return _cached_workloads


@router.post("/upload", response_model=WorkloadImportSummary)
def upload_workload_dataset(file: UploadFile = File(...)):
    """
    Import workload dataset from Excel (.xlsx, .xls), CSV, or JSON format with high precision.
    Validates attributes, normalizes timestamps and resource units, and sets active workload registry.
    """
    global _cached_workloads
    filename = file.filename or "uploaded_workloads"
    content = file.file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    workloads: List[Workload] = []
    file_type = "unknown"

    try:
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            file_type = "Excel (.xlsx/.xls)"
            workloads = load_workloads_from_excel(content)
        elif filename.endswith(".csv"):
            file_type = "CSV (.csv)"
            df = pd.read_csv(io.BytesIO(content))
            workloads = parse_workload_dataframe(df)
        elif filename.endswith(".json"):
            file_type = "JSON (.json)"
            raw_data = json.loads(content.decode("utf-8"))
            if isinstance(raw_data, list):
                df = pd.DataFrame(raw_data)
                workloads = parse_workload_dataframe(df)
            else:
                raise ValueError("JSON must contain an array of workload objects.")
        else:
            # Fallback: attempt Excel then CSV
            try:
                workloads = load_workloads_from_excel(content)
                file_type = "Excel"
            except Exception:
                df = pd.read_csv(io.BytesIO(content))
                workloads = parse_workload_dataframe(df)
                file_type = "CSV"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse workload file '{filename}': {str(e)}")

    if not workloads:
        raise HTTPException(status_code=400, detail="No valid workload records found in the uploaded file.")

    _cached_workloads = workloads

    total_cpu = sum(w.cpu_required for w in workloads)
    total_mem = sum(w.memory_required for w in workloads)
    avg_dur = sum(w.duration for w in workloads) / len(workloads)

    return WorkloadImportSummary(
        total_imported=len(workloads),
        filename=filename,
        file_type=file_type,
        total_cpu_cores=round(total_cpu, 1),
        total_memory_gb=round(total_mem, 1),
        avg_duration_hours=round(avg_dur, 2),
        workloads=workloads,
    )


@router.get("/template")
def download_workload_excel_template():
    """
    Download a structured, high-precision Excel workbook template (.xlsx) with sample data and documentation.
    """
    excel_bytes = generate_workload_excel_template()
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=ecofusion_workload_dataset_template.xlsx"
        },
    )


@router.get("/export/excel")
def export_workloads_excel():
    """
    Export the current active workloads to an Excel workbook (.xlsx).
    """
    workloads = get_current_workloads()
    import io
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        data = [
            {
                "id": w.id,
                "arrival_time": w.arrival_time,
                "cpu_required": w.cpu_required,
                "memory_required": w.memory_required,
                "duration": w.duration,
                "deadline": w.deadline,
                "priority": w.priority,
            }
            for w in workloads
        ]
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name="EcoFusion_Workloads", index=False)
    
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=ecofusion_workload_export.xlsx"
        },
    )
