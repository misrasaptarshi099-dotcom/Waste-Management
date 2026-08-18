"""
optimize.py
Phase 3: Capacitated Vehicle Routing Problem (CVRP) solver using Google OR-Tools.

Filters stops requiring collection (predicted fill >= 65% or overflow risk),
solves both a Static Baseline Route and a Dynamic AI Route, and calculates
quantified savings deltas (distance, fuel, cost, CO2, overflow bins).
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PROCESSED_DIR = BASE_DIR / "data" / "processed"
DATA_OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
STOPS_PATH = DATA_PROCESSED_DIR / "stops.json"
ZONES_PATH = DATA_PROCESSED_DIR / "zones.geojson"
ROUTES_OUTPUT_PATH = DATA_OUTPUTS_DIR / "routes_comparison.json"

# ---------------------------------------------------------------------------
# Fleet & Cost Constants (Indian municipal context — Pune PMC)
# ---------------------------------------------------------------------------
VEHICLE_CAPACITY_KG = 4000          # Tata Ace Mini Compactor payload
NUM_VEHICLES_PER_WARD = 5           # Fleet per ward (Tata Ace / Eicher compactors)
DIESEL_MILEAGE_KM_PER_L = 5.5      # Urban stop-and-go mileage
DIESEL_COST_INR_PER_L = 94.72      # Maharashtra avg diesel price (2026)
CO2_KG_PER_LITRE_DIESEL = 2.68     # IPCC emission factor
DRIVER_COST_INR_PER_KM = 8.50      # Approx loaded-truck driver cost/km
FILL_THRESHOLD_PCT = 65.0           # Minimum fill % to dispatch a truck
OVERFLOW_THRESHOLD_PCT = 80.0       # Overflow risk marker
SOLVER_TIME_LIMIT_SEC = 3           # OR-Tools solver time box


# ---------------------------------------------------------------------------
# Helper: load stops and zones
# ---------------------------------------------------------------------------

def load_stops() -> list:
    """Load stops.json from data/processed/."""
    with open(STOPS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_zones() -> dict:
    """Load zones.geojson and return a dict keyed by zone_id."""
    with open(ZONES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {
        feat["properties"]["zone_id"]: feat["properties"]
        for feat in data.get("features", [])
    }


# ---------------------------------------------------------------------------
# Static Baseline Route: Nearest-Neighbour greedy through ALL zone stops
# ---------------------------------------------------------------------------

def solve_static_route(
    depot_coords: tuple,
    stop_list: list,
    distance_matrix: list,
) -> dict:
    """
    Build a static baseline route visiting ALL stops in nearest-neighbour order.

    This represents the traditional fixed-schedule approach where trucks
    visit every stop regardless of fill level.

    Returns:
        dict with route_indices, ordered_stops, total_distance_km.
    """
    n = len(distance_matrix)
    if n <= 1:
        return {"route_indices": [0], "ordered_stops": [], "total_distance_km": 0.0}

    visited = [False] * n
    visited[0] = True
    route = [0]
    current = 0

    for _ in range(n - 1):
        best_next = -1
        best_dist = float("inf")
        for j in range(n):
            if not visited[j] and distance_matrix[current][j] < best_dist:
                best_dist = distance_matrix[current][j]
                best_next = j
        if best_next == -1:
            break
        visited[best_next] = True
        route.append(best_next)
        current = best_next

    # Return to depot
    route.append(0)

    from .utils.distance import total_route_distance_km
    total_km = total_route_distance_km(route, distance_matrix)

    return {
        "route_indices": route,
        "ordered_stops": [stop_list[i - 1] for i in route[1:-1]],
        "total_distance_km": round(total_km, 2),
    }


# ---------------------------------------------------------------------------
# Dynamic AI Route: OR-Tools CVRP on filtered high-priority stops
# ---------------------------------------------------------------------------

def solve_dynamic_route_ortools(
    depot_coords: tuple,
    active_stops: list,
    distance_matrix: list,
    demands_kg: list,
    num_vehicles: int = NUM_VEHICLES_PER_WARD,
    vehicle_capacity: int = VEHICLE_CAPACITY_KG,
    time_limit_sec: int = SOLVER_TIME_LIMIT_SEC,
) -> dict:
    """
    Solve a CVRP using Google OR-Tools on the filtered active stops.

    Args:
        depot_coords: (lat, lon) of the ward depot.
        active_stops: List of stop dicts that need collection.
        distance_matrix: Integer distance matrix in metres (index 0 = depot).
        demands_kg: List of demands in kg (index 0 = 0 for depot).
        num_vehicles: Number of available trucks.
        vehicle_capacity: Max payload per truck in kg.
        time_limit_sec: Solver time limit in seconds.

    Returns:
        dict with routes (per vehicle), total_distance_km, stops_served.
    """
    try:
        from ortools.constraint_solver import pywrapcp, routing_enums_pb2
    except ImportError:
        print("[WARN] ortools not installed. Falling back to greedy solver.")
        return _greedy_fallback(active_stops, distance_matrix, demands_kg,
                                num_vehicles, vehicle_capacity)

    n = len(distance_matrix)
    if n <= 1:
        return {
            "routes": [],
            "total_distance_km": 0.0,
            "stops_served": 0,
            "solver": "ortools-cvrp",
        }

    # Create routing model
    manager = pywrapcp.RoutingIndexManager(n, num_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)

    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Capacity constraint (demand callback)
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands_kg[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,                                          # no slack
        [vehicle_capacity] * num_vehicles,          # per-vehicle capacity
        True,                                       # start cumul at zero
        "Capacity",
    )

    # Search parameters
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = time_limit_sec

    # Solve
    solution = routing.SolveWithParameters(search_params)
    if solution is None:
        print("[WARN] OR-Tools found no feasible solution. Falling back to greedy.")
        return _greedy_fallback(active_stops, distance_matrix, demands_kg,
                                num_vehicles, vehicle_capacity)

    # Extract routes
    from .utils.distance import total_route_distance_km

    all_routes = []
    grand_total_km = 0.0
    total_stops = 0

    for vehicle_id in range(num_vehicles):
        route_nodes = []
        index = routing.Start(vehicle_id)
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            route_nodes.append(node)
            index = solution.Value(routing.NextVar(index))
        route_nodes.append(0)  # return to depot

        route_km = total_route_distance_km(route_nodes, distance_matrix)
        grand_total_km += route_km
        stops_on_route = [active_stops[i - 1] for i in route_nodes[1:-1] if i > 0]
        total_stops += len(stops_on_route)

        if len(stops_on_route) > 0:
            all_routes.append({
                "vehicle_id": vehicle_id + 1,
                "route_indices": route_nodes,
                "stops": stops_on_route,
                "distance_km": round(route_km, 2),
                "load_kg": sum(
                    demands_kg[i] for i in route_nodes[1:-1] if i > 0
                ),
            })

    return {
        "routes": all_routes,
        "total_distance_km": round(grand_total_km, 2),
        "stops_served": total_stops,
        "solver": "ortools-cvrp",
    }


# ---------------------------------------------------------------------------
# Greedy fallback (when OR-Tools unavailable)
# ---------------------------------------------------------------------------

def _greedy_fallback(
    active_stops: list,
    distance_matrix: list,
    demands_kg: list,
    num_vehicles: int,
    vehicle_capacity: int,
) -> dict:
    """
    Nearest-neighbour greedy CVRP fallback when OR-Tools is not installed.
    Splits stops into vehicle loads respecting capacity constraints.
    """
    from .utils.distance import total_route_distance_km

    n = len(distance_matrix)
    assigned = [False] * n
    assigned[0] = True  # depot

    all_routes = []
    grand_total_km = 0.0
    total_stops = 0

    for v in range(num_vehicles):
        route = [0]
        current = 0
        current_load = 0

        while True:
            best_next = -1
            best_dist = float("inf")
            for j in range(1, n):
                if (
                    not assigned[j]
                    and current_load + demands_kg[j] <= vehicle_capacity
                    and distance_matrix[current][j] < best_dist
                ):
                    best_dist = distance_matrix[current][j]
                    best_next = j
            if best_next == -1:
                break
            assigned[best_next] = True
            route.append(best_next)
            current_load += demands_kg[best_next]
            current = best_next

        route.append(0)
        route_km = total_route_distance_km(route, distance_matrix)
        grand_total_km += route_km
        stops_on_route = [active_stops[i - 1] for i in route[1:-1] if i > 0]
        total_stops += len(stops_on_route)

        if len(stops_on_route) > 0:
            all_routes.append({
                "vehicle_id": v + 1,
                "route_indices": route,
                "stops": stops_on_route,
                "distance_km": round(route_km, 2),
                "load_kg": sum(demands_kg[i] for i in route[1:-1] if i > 0),
            })

    return {
        "routes": all_routes,
        "total_distance_km": round(grand_total_km, 2),
        "stops_served": total_stops,
        "solver": "greedy-nn-fallback",
    }


# ---------------------------------------------------------------------------
# Delta Calculation Engine
# ---------------------------------------------------------------------------

def compute_savings_deltas(
    static_distance_km: float,
    dynamic_distance_km: float,
    static_stops_count: int,
    dynamic_stops_count: int,
    static_overflow_count: int,
    dynamic_overflow_count: int,
) -> dict:
    """
    Compute quantified savings between static (fixed-schedule) and
    dynamic (AI-optimized) routes.

    Returns:
        dict of savings metrics in Indian municipal context.
    """
    delta_km = static_distance_km - dynamic_distance_km
    delta_pct = (delta_km / static_distance_km * 100) if static_distance_km > 0 else 0.0
    delta_fuel_litres = delta_km / DIESEL_MILEAGE_KM_PER_L
    delta_fuel_cost_inr = delta_fuel_litres * DIESEL_COST_INR_PER_L
    delta_driver_cost_inr = delta_km * DRIVER_COST_INR_PER_KM
    delta_total_cost_inr = delta_fuel_cost_inr + delta_driver_cost_inr
    delta_co2_kg = delta_fuel_litres * CO2_KG_PER_LITRE_DIESEL
    delta_overflow = static_overflow_count - dynamic_overflow_count

    return {
        "static_distance_km": round(static_distance_km, 2),
        "dynamic_distance_km": round(dynamic_distance_km, 2),
        "distance_saved_km": round(delta_km, 2),
        "distance_saved_pct": round(delta_pct, 1),
        "static_stops": static_stops_count,
        "dynamic_stops": dynamic_stops_count,
        "stops_skipped": static_stops_count - dynamic_stops_count,
        "diesel_saved_litres": round(delta_fuel_litres, 2),
        "fuel_cost_saved_inr": round(delta_fuel_cost_inr, 2),
        "driver_cost_saved_inr": round(delta_driver_cost_inr, 2),
        "total_cost_saved_inr": round(delta_total_cost_inr, 2),
        "co2_avoided_kg": round(delta_co2_kg, 2),
        "overflow_bins_static": static_overflow_count,
        "overflow_bins_dynamic": dynamic_overflow_count,
        "overflow_delta": delta_overflow,
        "diesel_price_inr_per_l": DIESEL_COST_INR_PER_L,
        "vehicle_mileage_km_per_l": DIESEL_MILEAGE_KM_PER_L,
    }


# ---------------------------------------------------------------------------
# Main Orchestrator: run full comparison for a zone on a given date
# ---------------------------------------------------------------------------

def run_zone_optimization(
    zone_id: str,
    date_str: str,
    predicted_fills: Optional[list] = None,
) -> dict:
    """
    Run full static-vs-dynamic route comparison for a single zone.

    Args:
        zone_id: PMC ward zone ID (e.g. "PUNE_W01").
        date_str: "YYYY-MM-DD" format date.
        predicted_fills: Pre-computed fill predictions (from predict.py).
                         If None, will call predict_stop_fills().

    Returns:
        dict containing static_route, dynamic_route, savings, metadata.
    """
    from .utils.distance import build_distance_matrix

    # Load stops for this zone
    all_stops = load_stops()
    zone_stops = [s for s in all_stops if s["zone_id"] == zone_id and not s.get("is_depot")]
    depot = next((s for s in all_stops if s["zone_id"] == zone_id and s.get("is_depot")), None)

    if not zone_stops:
        return {"error": f"No stops found for zone {zone_id}"}
    if depot is None:
        # Use zone centroid as fallback depot
        zones = load_zones()
        z = zones.get(zone_id, {})
        depot = {
            "lat": z.get("centroid_lat", zone_stops[0]["lat"]),
            "lon": z.get("centroid_lon", zone_stops[0]["lon"]),
            "stop_id": f"DEP_{zone_id}",
            "name": f"{zone_id} Auto-Depot",
        }

    depot_coords = (depot["lat"], depot["lon"])

    # Get predicted fills
    if predicted_fills is None:
        if __package__:
            from .predict import predict_stop_fills
        else:
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            from predict import predict_stop_fills
        predicted_fills = predict_stop_fills(date_str)

    # Map fill predictions to zone stops
    fill_map = {p["stop_id"]: p for p in predicted_fills}
    for stop in zone_stops:
        pred = fill_map.get(stop["stop_id"], {})
        stop["predicted_fill_pct"] = pred.get("predicted_fill_pct", 50.0)
        stop["urgency"] = pred.get("urgency", "MODERATE")

    # ── STATIC ROUTE: visit ALL zone stops ──
    static_coords = [depot_coords] + [(s["lat"], s["lon"]) for s in zone_stops]
    static_dm = build_distance_matrix(static_coords)
    static_result = solve_static_route(depot_coords, zone_stops, static_dm)

    # Count overflows in static route (bins above threshold)
    static_overflow = sum(
        1 for s in zone_stops if s["predicted_fill_pct"] >= OVERFLOW_THRESHOLD_PCT
    )

    # ── DYNAMIC ROUTE: only stops with fill >= threshold ──
    active_stops = [
        s for s in zone_stops if s["predicted_fill_pct"] >= FILL_THRESHOLD_PCT
    ]
    if not active_stops:
        # Nothing to collect — return static-only data
        return {
            "zone_id": zone_id,
            "date": date_str,
            "total_zone_stops": len(zone_stops),
            "active_stops_count": 0,
            "static_route": static_result,
            "dynamic_route": {
                "routes": [],
                "total_distance_km": 0.0,
                "stops_served": 0,
                "solver": "none-needed",
            },
            "savings": compute_savings_deltas(
                static_result["total_distance_km"], 0.0,
                len(zone_stops), 0,
                static_overflow, 0,
            ),
        }

    dynamic_coords = [depot_coords] + [(s["lat"], s["lon"]) for s in active_stops]
    dynamic_dm = build_distance_matrix(dynamic_coords)

    # Compute demands: fill_pct * bin_capacity / 100
    demands = [0]  # depot has zero demand
    for s in active_stops:
        demand_kg = int(
            s["predicted_fill_pct"] * s.get("bin_capacity_kg", 400) / 100
        )
        demands.append(max(1, demand_kg))

    dynamic_result = solve_dynamic_route_ortools(
        depot_coords, active_stops, dynamic_dm, demands,
    )

    # Count overflows served in dynamic route
    dynamic_overflow_missed = sum(
        1 for s in zone_stops
        if s["predicted_fill_pct"] >= OVERFLOW_THRESHOLD_PCT
        and s["stop_id"] not in {
            a["stop_id"] for a in active_stops
        }
    )

    savings = compute_savings_deltas(
        static_result["total_distance_km"],
        dynamic_result["total_distance_km"],
        len(zone_stops),
        dynamic_result["stops_served"],
        static_overflow,
        dynamic_overflow_missed,
    )

    return {
        "zone_id": zone_id,
        "date": date_str,
        "total_zone_stops": len(zone_stops),
        "active_stops_count": len(active_stops),
        "static_route": static_result,
        "dynamic_route": dynamic_result,
        "savings": savings,
    }


# ---------------------------------------------------------------------------
# Full city-wide optimization across all 15 PMC wards
# ---------------------------------------------------------------------------

def run_full_city_optimization(date_str: str) -> dict:
    """
    Run optimization for all 15 PMC wards and aggregate savings.

    Args:
        date_str: "YYYY-MM-DD" format date.

    Returns:
        dict with per-zone results and city-wide aggregated metrics.
    """
    if __package__:
        from .predict import predict_stop_fills
    else:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from predict import predict_stop_fills

    predicted_fills = predict_stop_fills(date_str)

    zones = load_zones()
    zone_results = {}
    city_totals = {
        "static_distance_km": 0.0,
        "dynamic_distance_km": 0.0,
        "total_stops": 0,
        "active_stops": 0,
        "overflow_static": 0,
        "overflow_dynamic_missed": 0,
    }

    for zone_id in sorted(zones.keys()):
        print(f"[OPTIMIZE] Solving CVRP for {zone_id} ({zones[zone_id]['name']})...")
        result = run_zone_optimization(zone_id, date_str, predicted_fills)
        zone_results[zone_id] = result

        if "savings" in result:
            s = result["savings"]
            city_totals["static_distance_km"] += s["static_distance_km"]
            city_totals["dynamic_distance_km"] += s["dynamic_distance_km"]
            city_totals["total_stops"] += s["static_stops"]
            city_totals["active_stops"] += s["dynamic_stops"]
            city_totals["overflow_static"] += s["overflow_bins_static"]
            city_totals["overflow_dynamic_missed"] += s["overflow_bins_dynamic"]

    # City-wide savings aggregate
    city_savings = compute_savings_deltas(
        city_totals["static_distance_km"],
        city_totals["dynamic_distance_km"],
        city_totals["total_stops"],
        city_totals["active_stops"],
        city_totals["overflow_static"],
        city_totals["overflow_dynamic_missed"],
    )

    output = {
        "date": date_str,
        "city": "Pune (PMC)",
        "total_wards_optimized": len(zone_results),
        "city_savings": city_savings,
        "ward_results": zone_results,
    }

    # Save to disk
    DATA_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(ROUTES_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, default=str)
    print(f"\n[SUCCESS] Routes comparison saved to {ROUTES_OUTPUT_PATH}")

    return output


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    target_date = "2026-08-20"
    if len(sys.argv) > 1:
        target_date = sys.argv[1]

    print("=" * 70)
    print(f"  PHASE 3: CVRP ROUTE OPTIMIZATION — {target_date}")
    print("=" * 70)

    result = run_full_city_optimization(target_date)

    cs = result["city_savings"]
    print()
    print("=" * 70)
    print("  CITY-WIDE SAVINGS SUMMARY")
    print("=" * 70)
    print(f"  Static Route Distance:   {cs['static_distance_km']:>8.2f} km")
    print(f"  Dynamic Route Distance:  {cs['dynamic_distance_km']:>8.2f} km")
    print(f"  Distance Saved:          {cs['distance_saved_km']:>8.2f} km ({cs['distance_saved_pct']:.1f}%)")
    print(f"  Diesel Saved:            {cs['diesel_saved_litres']:>8.2f} litres")
    print(f"  Fuel Cost Saved:      INR{cs['fuel_cost_saved_inr']:>8.2f}")
    print(f"  Total Cost Saved:     INR{cs['total_cost_saved_inr']:>8.2f}")
    print(f"  CO2 Avoided:             {cs['co2_avoided_kg']:>8.2f} kg")
    print(f"  Stops Skipped:           {cs['stops_skipped']:>8d}")
    print(f"  Overflow Bins (Static):  {cs['overflow_bins_static']:>8d}")
    print(f"  Overflow Missed (AI):    {cs['overflow_bins_dynamic']:>8d}")
    print("=" * 70)
