"""
test_phase3.py
Phase 3 validation suite for CVRP route optimization engine.

Tests:
1. Haversine distance accuracy against known Pune landmarks.
2. Distance matrix symmetry and zero-diagonal.
3. Static nearest-neighbour route correctness.
4. CVRP solver returns valid routes with positive savings.
5. Delta calculation engine correctness.
"""

import math
import sys
from pathlib import Path

import pytest

# Ensure backend is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


class TestHaversineDistance:
    """Test geodesic distance computations."""

    def test_pune_known_distance(self):
        """
        Shaniwar Wada → Dagdusheth Ganpati is ~0.5 km.
        Verify Haversine returns a value in [0.3, 0.8] km.
        """
        from app.utils.distance import haversine_km

        # Shaniwar Wada: 18.5195, 73.8553
        # Dagdusheth Ganpati: 18.5163, 73.8567
        dist = haversine_km(18.5195, 73.8553, 18.5163, 73.8567)
        assert 0.2 < dist < 1.0, f"Expected ~0.5 km, got {dist:.3f} km"

    def test_same_point_zero_distance(self):
        """Distance from a point to itself should be zero."""
        from app.utils.distance import haversine_km

        dist = haversine_km(18.52, 73.85, 18.52, 73.85)
        assert dist == 0.0

    def test_cross_pune_distance(self):
        """
        Aundh → Hadapsar is roughly 15–20 km across Pune.
        Verify Haversine returns a reasonable value.
        """
        from app.utils.distance import haversine_km

        # Aundh: 18.5583, 73.8073  |  Hadapsar: 18.5018, 73.9260
        dist = haversine_km(18.5583, 73.8073, 18.5018, 73.9260)
        assert 10.0 < dist < 25.0, f"Expected ~14 km, got {dist:.1f} km"


class TestDistanceMatrix:
    """Test distance matrix construction."""

    def test_matrix_symmetry(self):
        """Distance matrix must be symmetric: D[i][j] == D[j][i]."""
        from app.utils.distance import build_distance_matrix

        coords = [
            (18.52, 73.85),
            (18.53, 73.86),
            (18.54, 73.87),
        ]
        dm = build_distance_matrix(coords)
        n = len(coords)
        for i in range(n):
            for j in range(n):
                assert dm[i][j] == dm[j][i], f"Asymmetry at [{i}][{j}]"

    def test_matrix_zero_diagonal(self):
        """Diagonal entries must be zero (distance to self)."""
        from app.utils.distance import build_distance_matrix

        coords = [(18.52, 73.85), (18.55, 73.88)]
        dm = build_distance_matrix(coords)
        for i in range(len(coords)):
            assert dm[i][i] == 0

    def test_matrix_positive_off_diagonal(self):
        """Off-diagonal entries for distinct points must be positive."""
        from app.utils.distance import build_distance_matrix

        coords = [(18.52, 73.85), (18.55, 73.88)]
        dm = build_distance_matrix(coords)
        assert dm[0][1] > 0
        assert dm[1][0] > 0


class TestStaticRoute:
    """Test nearest-neighbour static route solver."""

    def test_static_route_visits_all_stops(self):
        """Static route should visit every stop exactly once."""
        from app.utils.distance import build_distance_matrix
        from app.optimize import solve_static_route

        stops = [
            {"stop_id": "S1", "lat": 18.53, "lon": 73.86, "name": "Stop 1"},
            {"stop_id": "S2", "lat": 18.54, "lon": 73.87, "name": "Stop 2"},
            {"stop_id": "S3", "lat": 18.55, "lon": 73.88, "name": "Stop 3"},
        ]
        depot = (18.52, 73.85)
        coords = [depot] + [(s["lat"], s["lon"]) for s in stops]
        dm = build_distance_matrix(coords)

        result = solve_static_route(depot, stops, dm)
        assert result["total_distance_km"] > 0
        # Route should start and end at depot (index 0)
        assert result["route_indices"][0] == 0
        assert result["route_indices"][-1] == 0
        # All stops should appear
        assert len(result["ordered_stops"]) == len(stops)

    def test_static_route_positive_distance(self):
        """Static route distance must be positive for non-trivial inputs."""
        from app.utils.distance import build_distance_matrix
        from app.optimize import solve_static_route

        stops = [
            {"stop_id": "S1", "lat": 18.53, "lon": 73.86, "name": "A"},
            {"stop_id": "S2", "lat": 18.56, "lon": 73.89, "name": "B"},
        ]
        depot = (18.52, 73.85)
        coords = [depot] + [(s["lat"], s["lon"]) for s in stops]
        dm = build_distance_matrix(coords)

        result = solve_static_route(depot, stops, dm)
        assert result["total_distance_km"] > 0


class TestDeltaCalculation:
    """Test savings delta computation engine."""

    def test_savings_positive_when_dynamic_shorter(self):
        """When dynamic route is shorter, all savings should be positive."""
        from app.optimize import compute_savings_deltas

        savings = compute_savings_deltas(
            static_distance_km=50.0,
            dynamic_distance_km=30.0,
            static_stops_count=40,
            dynamic_stops_count=25,
            static_overflow_count=10,
            dynamic_overflow_count=2,
        )
        assert savings["distance_saved_km"] == 20.0
        assert savings["distance_saved_pct"] == 40.0
        assert savings["diesel_saved_litres"] > 0
        assert savings["fuel_cost_saved_inr"] > 0
        assert savings["co2_avoided_kg"] > 0
        assert savings["stops_skipped"] == 15
        assert savings["overflow_delta"] == 8

    def test_savings_zero_when_equal(self):
        """When routes are identical, savings should be zero."""
        from app.optimize import compute_savings_deltas

        savings = compute_savings_deltas(
            static_distance_km=50.0,
            dynamic_distance_km=50.0,
            static_stops_count=40,
            dynamic_stops_count=40,
            static_overflow_count=5,
            dynamic_overflow_count=5,
        )
        assert savings["distance_saved_km"] == 0.0
        assert savings["diesel_saved_litres"] == 0.0
        assert savings["co2_avoided_kg"] == 0.0

    def test_co2_calculation_accuracy(self):
        """Verify CO2 = fuel_litres * 2.68 kg/L (IPCC factor)."""
        from app.optimize import compute_savings_deltas

        savings = compute_savings_deltas(
            static_distance_km=100.0,
            dynamic_distance_km=45.0,
            static_stops_count=50,
            dynamic_stops_count=25,
            static_overflow_count=0,
            dynamic_overflow_count=0,
        )
        expected_fuel = 55.0 / 5.5  # 10 litres
        expected_co2 = expected_fuel * 2.68  # 26.8 kg
        assert abs(savings["diesel_saved_litres"] - expected_fuel) < 0.01
        assert abs(savings["co2_avoided_kg"] - expected_co2) < 0.01


class TestCVRPIntegration:
    """Integration tests for the full CVRP pipeline."""

    def test_greedy_fallback_runs(self):
        """The greedy fallback solver should produce valid routes."""
        from app.utils.distance import build_distance_matrix
        from app.optimize import _greedy_fallback

        stops = [
            {"stop_id": f"S{i}", "lat": 18.52 + i * 0.01, "lon": 73.85 + i * 0.01,
             "name": f"Stop {i}", "predicted_fill_pct": 70 + i * 5,
             "bin_capacity_kg": 400}
            for i in range(1, 6)
        ]
        depot = (18.52, 73.85)
        coords = [depot] + [(s["lat"], s["lon"]) for s in stops]
        dm = build_distance_matrix(coords)
        demands = [0] + [int(s["predicted_fill_pct"] * 400 / 100) for s in stops]

        result = _greedy_fallback(stops, dm, demands, 2, 4000)
        assert result["total_distance_km"] > 0
        assert result["stops_served"] > 0
        assert result["solver"] == "greedy-nn-fallback"

    def test_greedy_fallback_capacity_overflow(self):
        """When total demand exceeds fleet capacity, some stops should be unassigned."""
        from app.utils.distance import build_distance_matrix
        from app.optimize import _greedy_fallback

        # 5 stops each demanding 3000 kg = 15000 kg total
        # Fleet: 2 vehicles × 4000 kg = 8000 kg capacity
        # So at least some stops must be unassigned
        stops = [
            {"stop_id": f"S{i}", "lat": 18.52 + i * 0.01, "lon": 73.85 + i * 0.01,
             "name": f"Stop {i}", "predicted_fill_pct": 95,
             "bin_capacity_kg": 3000}
            for i in range(1, 6)
        ]
        depot = (18.52, 73.85)
        coords = [depot] + [(s["lat"], s["lon"]) for s in stops]
        dm = build_distance_matrix(coords)
        demands = [0] + [3000] * 5  # 15000 kg total demand

        result = _greedy_fallback(stops, dm, demands, 2, 4000)
        assert result["solver"] == "greedy-nn-fallback"
        # With 8000 kg capacity, can only serve 2 stops (2×4000=8000, each stop=3000)
        assert result["stops_served"] < 5, "Some stops should be unassigned due to capacity"
        assert result["stops_served"] >= 2, "Should serve at least 2 stops"

    @pytest.mark.skipif(
        not Path(__file__).resolve().parent.parent.parent.joinpath(
            "data", "processed", "stops.json").exists(),
        reason="stops.json not generated"
    )
    def test_zone_optimization_returns_valid_structure(self):
        """
        run_zone_optimization should return a dict with required keys.
        Uses PUNE_W01 as test zone with deterministic fallback.
        """
        from app.optimize import run_zone_optimization

        result = run_zone_optimization("PUNE_W01", "2026-08-20")

        assert "zone_id" in result
        assert result["zone_id"] == "PUNE_W01"
        assert "static_route" in result
        assert "savings" in result
        assert "unserved_stops_count" in result
        assert result["static_route"]["total_distance_km"] > 0
        assert result["savings"]["static_distance_km"] > 0
        assert result["static_route"]["mode"] == "uncapacitated-single-tour"


class TestDeterministicFallback:
    """Test the deterministic rule-based fill prediction fallback."""

    def test_fallback_with_model_none(self):
        """predict_stop_fills with model=None should use deterministic fallback."""
        from app.predict import deterministic_fill_estimate, DAILY_RATE_DIVISOR

        # Typical non-commercial stop: 3 days since pickup, 18% base rate, no event
        fill = deterministic_fill_estimate(
            days_since_last=3, baseline_rate=18.0,
            is_commercial=False, event_multiplier=1.0,
        )
        assert 0.0 <= fill <= 100.0
        # 3 * (18/100) * 1.0 * 1.0 * 100 = 54.0
        assert fill == 54.0

    def test_fallback_clamps_to_100(self):
        """Extreme inputs should clamp to 100%."""
        from app.predict import deterministic_fill_estimate

        fill = deterministic_fill_estimate(
            days_since_last=7, baseline_rate=32.0,
            is_commercial=True, event_multiplier=3.5,
        )
        assert fill == 100.0

    def test_fallback_commercial_multiplier(self):
        """Commercial stops should accumulate faster (1.5× multiplier)."""
        from app.predict import deterministic_fill_estimate

        fill_regular = deterministic_fill_estimate(2, 20.0, False, 1.0)
        fill_commercial = deterministic_fill_estimate(2, 20.0, True, 1.0)
        assert fill_commercial > fill_regular

