from typing import List, Dict, Any
from ..models.scheduling import SchedulingDecision, SchedulingStatus


def is_sla_met(completion_time: float, deadline: float) -> bool:
    """
    Check if a workload completion time satisfies its SLA deadline.
    """
    return round(completion_time, 4) <= round(deadline, 4)


def evaluate_sla_metrics(
    decisions: List[SchedulingDecision],
    total_submitted_workloads: int
) -> Dict[str, Any]:
    """
    Calculate summary SLA metrics across all decisions.
    """
    scheduled_decisions = [d for d in decisions if d.status == SchedulingStatus.SCHEDULED]
    unscheduled_count = total_submitted_workloads - len(scheduled_decisions)

    sla_violations = sum(1 for d in scheduled_decisions if not d.sla_met)
    
    # SLA violation rate calculated relative to total submitted workloads
    sla_violation_rate = (
        round(((sla_violations + unscheduled_count) / total_submitted_workloads) * 100.0, 2)
        if total_submitted_workloads > 0
        else 0.0
    )

    completion_times = [d.completion_time for d in scheduled_decisions if d.completion_time is not None]
    avg_completion_time = (
        round(sum(completion_times) / len(completion_times), 2)
        if len(completion_times) > 0
        else 0.0
    )

    return {
        "total_submitted": total_submitted_workloads,
        "scheduled_count": len(scheduled_decisions),
        "unscheduled_count": unscheduled_count,
        "sla_violations": sla_violations,
        "sla_violation_rate": sla_violation_rate,
        "average_completion_time": avg_completion_time,
    }
