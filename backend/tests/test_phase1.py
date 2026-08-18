"""
test_phase1.py
Unit tests for Phase 1 Data Ingestion & Sampling:
Verifies zones.geojson and stops.json integrity, schema compliance,
and spatial correctness.
"""

import json
from pathlib import Path

from shapely.geometry import shape

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ZONES_PATH = BASE_DIR / "data" / "processed" / "zones.geojson"
STOPS_PATH = BASE_DIR / "data" / "processed" / "stops.json"

import pytest


@pytest.mark.skipif(not ZONES_PATH.exists(), reason="zones.geojson not generated")
def test_zones_geojson_integrity():
    assert ZONES_PATH.exists(), f"Missing {ZONES_PATH}"
    with open(ZONES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data.get("type") == "FeatureCollection"
    features = data.get("features", [])
    assert len(features) == 15, f"Expected 15 wards, found {len(features)}"

    zone_ids = set()
    for f in features:
        props = f["properties"]
        geom = shape(f["geometry"])

        # Check required schema keys
        required_keys = [
            "zone_id", "name", "city", "state", "day", "cycle",
            "area_sqkm", "population_density", "centroid_lat",
            "centroid_lon", "n_stops", "depot_name"
        ]
        for key in required_keys:
            assert key in props, f"Missing key '{key}' in zone {props.get('zone_id')}"

        assert props["city"] == "Pune (PMC)"
        assert props["state"] == "Maharashtra"
        assert props["area_sqkm"] > 0.5
        assert 18.4 <= props["centroid_lat"] <= 18.7, f"Lat out of Pune bounds: {props['centroid_lat']}"
        assert 73.7 <= props["centroid_lon"] <= 74.1, f"Lon out of Pune bounds: {props['centroid_lon']}"
        assert geom.is_valid, f"Invalid polygon geometry in {props['zone_id']}"
        zone_ids.add(props["zone_id"])

    assert len(zone_ids) == 15, "Duplicate zone_ids detected"
    print("[TEST PASS] zones.geojson verified (15 valid ward polygons).")


@pytest.mark.skipif(not STOPS_PATH.exists(), reason="stops.json not generated")
def test_stops_json_integrity():
    assert STOPS_PATH.exists(), f"Missing {STOPS_PATH}"
    with open(STOPS_PATH, "r", encoding="utf-8") as f:
        stops = json.load(f)

    assert len(stops) >= 300, f"Expected >= 300 stops, found {len(stops)}"

    depot_count = 0
    stop_ids = set()
    for s in stops:
        required_keys = [
            "stop_id", "zone_id", "ward_name", "name", "lat", "lon",
            "bin_capacity_kg", "baseline_fill_rate", "commercial_flag",
            "is_depot", "address"
        ]
        for key in required_keys:
            assert key in s, f"Missing key '{key}' in stop {s.get('stop_id')}"

        assert 18.4 <= s["lat"] <= 18.7, f"Lat out of Pune bounds: {s['lat']}"
        assert 73.7 <= s["lon"] <= 74.1, f"Lon out of Pune bounds: {s['lon']}"
        assert s["bin_capacity_kg"] > 0
        stop_ids.add(s["stop_id"])

        if s["is_depot"]:
            depot_count += 1

    assert len(stop_ids) == len(stops), "Duplicate stop_ids detected"
    assert depot_count == 15, f"Expected 15 transfer depots, found {depot_count}"
    print(f"[TEST PASS] stops.json verified ({len(stops)} stops, 15 depots).")


if __name__ == "__main__":
    test_zones_geojson_integrity()
    test_stops_json_integrity()
    print("[ALL PHASE 1 TESTS PASSED SUCCESSFULLY]")
