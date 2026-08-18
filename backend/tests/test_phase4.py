"""
test_phase4.py
Unit tests for Phase 4: FastAPI REST API endpoints.

Tests API responses, schema validation, status codes, and CORS headers
using FastAPI's TestClient (no live server required).
"""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Import app from the package
from app.main import app

client = TestClient(app)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ZONES_PATH = BASE_DIR / "data" / "processed" / "zones.geojson"
STOPS_PATH = BASE_DIR / "data" / "processed" / "stops.json"
ROUTES_PATH = BASE_DIR / "data" / "outputs" / "routes_comparison.json"


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    """Tests for GET /api/health."""

    def test_health_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_response_shape(self):
        response = client.get("/api/health")
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "1.0.0"
        assert data["city"] == "Pune (PMC)"
        assert data["total_wards"] == 15
        assert "pipeline_phases" in data
        assert isinstance(data["pipeline_phases"], dict)

    def test_health_pipeline_phases(self):
        response = client.get("/api/health")
        phases = response.json()["pipeline_phases"]
        assert "phase1_data_ingestion" in phases
        assert "phase4_api_layer" in phases
        assert phases["phase4_api_layer"] is True


# ---------------------------------------------------------------------------
# Zones endpoint
# ---------------------------------------------------------------------------

class TestZonesEndpoint:
    """Tests for GET /api/zones."""

    @pytest.mark.skipif(not ZONES_PATH.exists(), reason="zones.geojson not generated")
    def test_zones_returns_200(self):
        response = client.get("/api/zones")
        assert response.status_code == 200

    @pytest.mark.skipif(not ZONES_PATH.exists(), reason="zones.geojson not generated")
    def test_zones_returns_geojson(self):
        response = client.get("/api/zones")
        data = response.json()
        assert data["type"] == "FeatureCollection"
        assert len(data["features"]) == 15

    @pytest.mark.skipif(not ZONES_PATH.exists(), reason="zones.geojson not generated")
    def test_zones_feature_schema(self):
        response = client.get("/api/zones")
        feat = response.json()["features"][0]
        props = feat["properties"]
        assert "zone_id" in props
        assert "name" in props
        assert "centroid_lat" in props
        assert "centroid_lon" in props
        assert "day" in props
        assert "area_sqkm" in props


# ---------------------------------------------------------------------------
# Stops endpoint
# ---------------------------------------------------------------------------

class TestStopsEndpoint:
    """Tests for GET /api/stops."""

    @pytest.mark.skipif(not STOPS_PATH.exists(), reason="stops.json not generated")
    def test_stops_returns_200(self):
        response = client.get("/api/stops", params={"date": "2026-08-20"})
        assert response.status_code == 200

    @pytest.mark.skipif(not STOPS_PATH.exists(), reason="stops.json not generated")
    def test_stops_response_shape(self):
        response = client.get("/api/stops", params={"date": "2026-08-20"})
        data = response.json()
        assert "date" in data
        assert data["date"] == "2026-08-20"
        assert "total_stops" in data
        assert data["total_stops"] > 300
        assert "stops" in data
        assert len(data["stops"]) == data["total_stops"]

    @pytest.mark.skipif(not STOPS_PATH.exists(), reason="stops.json not generated")
    def test_stops_item_schema(self):
        response = client.get("/api/stops", params={"date": "2026-08-20"})
        stop = response.json()["stops"][0]
        required_keys = [
            "stop_id", "zone_id", "lat", "lon",
            "predicted_fill_pct", "urgency", "is_overflow_risk",
        ]
        for key in required_keys:
            assert key in stop, f"Missing key '{key}' in stop response"
        assert 0.0 <= stop["predicted_fill_pct"] <= 100.0
        assert stop["urgency"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")

    def test_stops_invalid_date_returns_400(self):
        response = client.get("/api/stops", params={"date": "not-a-date"})
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# Savings endpoint
# ---------------------------------------------------------------------------

class TestSavingsEndpoint:
    """Tests for GET /api/stats/savings."""

    @pytest.mark.skipif(
        not ROUTES_PATH.exists(), reason="routes_comparison.json not generated"
    )
    def test_savings_returns_200(self):
        # Read cached date from routes file
        with open(ROUTES_PATH, "r", encoding="utf-8") as f:
            cached_date = json.load(f).get("date", "2026-08-20")
        response = client.get("/api/stats/savings", params={"date": cached_date})
        assert response.status_code == 200

    @pytest.mark.skipif(
        not ROUTES_PATH.exists(), reason="routes_comparison.json not generated"
    )
    def test_savings_response_shape(self):
        with open(ROUTES_PATH, "r", encoding="utf-8") as f:
            cached_date = json.load(f).get("date", "2026-08-20")
        response = client.get("/api/stats/savings", params={"date": cached_date})
        data = response.json()
        assert "distance_saved_km" in data
        assert "distance_saved_pct" in data
        assert "diesel_saved_litres" in data
        assert "total_cost_saved_inr" in data
        assert "co2_avoided_kg" in data
        assert "stops_skipped" in data
        assert data["city"] == "Pune (PMC)"
        assert data["distance_saved_km"] > 0


# ---------------------------------------------------------------------------
# Citizen lookup endpoint
# ---------------------------------------------------------------------------

class TestCitizenLookupEndpoint:
    """Tests for GET /api/citizen/lookup."""

    @pytest.mark.skipif(not ZONES_PATH.exists(), reason="zones.geojson not generated")
    def test_citizen_lookup_returns_200(self):
        response = client.get("/api/citizen/lookup", params={"zone_id": "PUNE_W01"})
        assert response.status_code == 200

    @pytest.mark.skipif(not ZONES_PATH.exists(), reason="zones.geojson not generated")
    def test_citizen_lookup_schedule(self):
        response = client.get("/api/citizen/lookup", params={"zone_id": "PUNE_W01"})
        data = response.json()
        assert data["zone_id"] == "PUNE_W01"
        assert "schedule" in data
        sched = data["schedule"]
        assert "ward_name" in sched
        assert "collection_day" in sched
        assert "cycle" in sched
        assert "depot_name" in sched
        assert "next_pickup_eta" in sched

    @pytest.mark.skipif(not ZONES_PATH.exists(), reason="zones.geojson not generated")
    def test_citizen_lookup_waste_streams(self):
        response = client.get("/api/citizen/lookup", params={"zone_id": "PUNE_W01"})
        data = response.json()
        assert "waste_streams" in data
        assert len(data["waste_streams"]) == 4
        stream_types = [ws["type"] for ws in data["waste_streams"]]
        assert "Wet / Organic" in stream_types
        assert "Dry / Recyclable" in stream_types

    def test_citizen_lookup_invalid_zone(self):
        response = client.get("/api/citizen/lookup", params={"zone_id": "PUNE_W99"})
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# CORS headers
# ---------------------------------------------------------------------------

class TestCORSHeaders:
    """Verify CORS middleware is active."""

    def test_cors_allows_origin(self):
        response = client.get(
            "/api/health",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers


# ---------------------------------------------------------------------------
# Routes comparison endpoint (smoke test — only checks cached data)
# ---------------------------------------------------------------------------

class TestRoutesEndpoint:
    """Tests for GET /api/routes/comparison."""

    @pytest.mark.skipif(
        not ROUTES_PATH.exists(), reason="routes_comparison.json not generated"
    )
    def test_routes_returns_200_cached(self):
        with open(ROUTES_PATH, "r", encoding="utf-8") as f:
            cached_date = json.load(f).get("date", "2026-08-20")
        response = client.get(
            "/api/routes/comparison", params={"date": cached_date}
        )
        assert response.status_code == 200

    @pytest.mark.skipif(
        not ROUTES_PATH.exists(), reason="routes_comparison.json not generated"
    )
    def test_routes_response_shape(self):
        with open(ROUTES_PATH, "r", encoding="utf-8") as f:
            cached_date = json.load(f).get("date", "2026-08-20")
        response = client.get(
            "/api/routes/comparison", params={"date": cached_date}
        )
        data = response.json()
        assert data["city"] == "Pune (PMC)"
        assert data["total_wards_optimized"] == 15
        assert "city_savings" in data
        assert "ward_results" in data
        assert len(data["ward_results"]) == 15
