from typing import List, Tuple
from .schemas import ParetoSolution, CompromiseWeights


def select_best_compromise_solution(
    solutions: List[ParetoSolution],
    weights: CompromiseWeights
) -> Tuple[ParetoSolution, List[ParetoSolution]]:
    """
    Select best-compromise solution from Pareto set using normalized weighted objective distance.
    """
    if not solutions:
        raise ValueError("Cannot select best-compromise solution from empty Pareto set.")

    if len(solutions) == 1:
        sol = solutions[0]
        sol.score = 0.0
        return sol, solutions

    carbons = [s.carbon_kg for s in solutions]
    energies = [s.energy_kwh for s in solutions]
    costs = [s.cost_usd for s in solutions]

    min_c, max_c = min(carbons), max(carbons)
    min_e, max_e = min(energies), max(energies)
    min_dollar, max_dollar = min(costs), max(costs)

    range_c = (max_c - min_c) if (max_c - min_c) > 1e-6 else 1.0
    range_e = (max_e - min_e) if (max_e - min_e) > 1e-6 else 1.0
    range_dollar = (max_dollar - min_dollar) if (max_dollar - min_dollar) > 1e-6 else 1.0

    scored_solutions: List[ParetoSolution] = []
    best_sol = solutions[0]
    min_score = float("inf")

    for sol in solutions:
        norm_c = (sol.carbon_kg - min_c) / range_c
        norm_e = (sol.energy_kwh - min_e) / range_e
        norm_dollar = (sol.cost_usd - min_dollar) / range_dollar
        norm_sla = sol.sla_violation_rate / 100.0

        total_score = (
            weights.carbon * norm_c +
            weights.energy * norm_e +
            weights.cost * norm_dollar +
            weights.sla * norm_sla
        )

        sol.score = round(float(total_score), 4)
        scored_solutions.append(sol)

        if sol.score < min_score:
            min_score = sol.score
            best_sol = sol

    return best_sol, scored_solutions
