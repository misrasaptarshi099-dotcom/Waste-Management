"""
schemas.py
Phase 4: Pydantic v2 response schemas for the FastAPI REST API.

Models mirror the data contracts from:
  - zones.geojson (Phase 1)
  - stops.json (Phase 1)
  - predict.py output (Phase 2)
  - routes_comparison.json (Phase 3)
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


# ---------------------------------------------------------------------------
# Zone / Ward schemas
# ---------------------------------------------------------------------------

class ZoneProperties(BaseModel):
    """Properties block of a single GeoJSON zone feature."""
    zone_id: str
    name: str
    city: str
    state: str
    day: str
    cycle: str
    area_sqkm: float
    population_density: float
    centroid_lat: float
    centroid_lon: float
    n_stops: int
    depot_name: str


class ZoneGeometry(BaseModel):
    """GeoJSON geometry object (Polygon or MultiPolygon)."""
    type: str
    coordinates: list


class ZoneFeature(BaseModel):
    """Single GeoJSON Feature for a ward zone."""
    type: str = "Feature"
    properties: ZoneProperties
    geometry: ZoneGeometry


class ZonesResponse(BaseModel):
    """Full GeoJSON FeatureCollection response for /api/zones."""
    type: str = "FeatureCollection"
    features: list[ZoneFeature]


# ---------------------------------------------------------------------------
# Stop schemas
# ---------------------------------------------------------------------------

class StopModel(BaseModel):
    """Individual collection stop with fill prediction."""
    stop_id: str
    zone_id: str
    ward_name: str = ""
    name: str = ""
    lat: float
    lon: float
    predicted_fill_pct: float = Field(ge=0.0, le=100.0)
    urgency: str = "MODERATE"
    is_overflow_risk: bool = False
    event_flag: bool = False
    event_name: Optional[str] = None
    days_since_last_pickup: int = 1
    bin_capacity_kg: int = 400


class StopsResponse(BaseModel):
    """Response for /api/stops."""
    date: str
    total_stops: int
    stops: list[StopModel]


# ---------------------------------------------------------------------------
# Route schemas
# ---------------------------------------------------------------------------

class RouteStopRef(BaseModel):
    """Minimal stop reference within a route."""
    stop_id: str
    name: str = ""
    lat: float
    lon: float
    predicted_fill_pct: float = 0.0


class VehicleRoute(BaseModel):
    """Single vehicle's assigned route."""
    vehicle_id: int
    route_indices: list[int]
    stops: list[RouteStopRef]
    distance_km: float
    load_kg: int = 0


class RouteResult(BaseModel):
    """Aggregated route result (static or dynamic)."""
    routes: list[VehicleRoute] = []
    total_distance_km: float = 0.0
    stops_served: int = 0
    solver: str = "none"
    mode: Optional[str] = None
    route_indices: Optional[list[int]] = None
    ordered_stops: Optional[list] = None


class SavingsMetrics(BaseModel):
    """Quantified delta between static and dynamic routes."""
    static_distance_km: float
    dynamic_distance_km: float
    distance_saved_km: float
    distance_saved_pct: float
    static_stops: int
    dynamic_stops: int
    stops_skipped: int
    diesel_saved_litres: float
    fuel_cost_saved_inr: float
    driver_cost_saved_inr: float
    total_cost_saved_inr: float
    co2_avoided_kg: float
    overflow_bins_static: int
    overflow_bins_dynamic: int
    overflow_delta: int
    diesel_price_inr_per_l: float
    vehicle_mileage_km_per_l: float


class ZoneRouteComparison(BaseModel):
    """Full static-vs-dynamic comparison for a single zone."""
    zone_id: str
    date: str
    total_zone_stops: int
    active_stops_count: int
    unserved_stops_count: int = 0
    static_route: RouteResult
    dynamic_route: RouteResult
    savings: SavingsMetrics


class RoutePlanResponse(BaseModel):
    """City-wide routes comparison response for /api/routes/comparison."""
    date: str
    city: str
    total_wards_optimized: int
    city_savings: SavingsMetrics
    ward_results: dict[str, ZoneRouteComparison]


# ---------------------------------------------------------------------------
# City-wide savings summary
# ---------------------------------------------------------------------------

class CitySavingsResponse(BaseModel):
    """Lightweight savings-only response for /api/stats/savings."""
    date: str
    city: str
    distance_saved_km: float
    distance_saved_pct: float
    diesel_saved_litres: float
    total_cost_saved_inr: float
    co2_avoided_kg: float
    stops_skipped: int
    overflow_bins_eliminated: int
    total_wards: int


# ---------------------------------------------------------------------------
# Citizen lookup
# ---------------------------------------------------------------------------

class CitizenSchedule(BaseModel):
    """Schedule information for a citizen's zone."""
    zone_id: str
    ward_name: str
    collection_day: str
    cycle: str
    depot_name: str
    next_pickup_eta: Optional[str] = None
    nearest_stop: Optional[StopModel] = None
    zone_fill_summary: Optional[dict] = None


class CitizenLookupResponse(BaseModel):
    """Response for /api/citizen/lookup."""
    zone_id: str
    schedule: CitizenSchedule
    waste_streams: list[dict] = [
        {"type": "Wet / Organic", "bin_color": "Green", "examples": "Kitchen scraps, fruit peels, flowers"},
        {"type": "Dry / Recyclable", "bin_color": "Blue", "examples": "Paper, plastic, metal, glass"},
        {"type": "Sanitary / Reject", "bin_color": "Red", "examples": "Diapers, sanitary pads, masks"},
        {"type": "E-Waste / Hazardous", "bin_color": "Grey", "examples": "Batteries, bulbs, old phones"},
    ]


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Response for /api/health."""
    status: str = "ok"
    version: str = "1.0.0"
    city: str = "Pune (PMC)"
    total_wards: int = 15
    pipeline_phases: dict = {
        "phase1_data_ingestion": True,
        "phase2_ml_predictor": True,
        "phase3_route_optimizer": True,
        "phase4_api_layer": True,
    }
