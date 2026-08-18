"""
main.py
Phase 4: FastAPI REST API serving the SWM AI Optimization Engine.

Endpoints:
  GET  /api/health                  — Liveness check
  GET  /api/zones                   — Ward boundary GeoJSON
  GET  /api/stops?date=YYYY-MM-DD   — Stop fill predictions for a date
  GET  /api/routes/comparison?date=  — Full static-vs-dynamic route comparison
  GET  /api/stats/savings?date=      — Lightweight city-wide savings KPIs
  GET  /api/citizen/lookup?zone_id=  — Citizen-facing schedule and waste guide
"""

import asyncio
import json
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, date
from pathlib import Path
from typing import Optional, Union

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .schemas import (
    HealthResponse,
    ZonesResponse,
    StopsResponse,
    StopModel,
    RoutePlanResponse,
    OptimizationJobStatus,
    CitySavingsResponse,
    CitizenLookupResponse,
    CitizenSchedule,
    ZoneFillSummary,
)

# ---------------------------------------------------------------------------
# Path configuration
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PROCESSED = BASE_DIR / "data" / "processed"
DATA_OUTPUTS = BASE_DIR / "data" / "outputs"

ZONES_PATH = DATA_PROCESSED / "zones.geojson"
STOPS_PATH = DATA_PROCESSED / "stops.json"
ROUTES_PATH = DATA_OUTPUTS / "routes_comparison.json"

# ---------------------------------------------------------------------------
# FastAPI app initialisation
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SWM AI Route Optimizer — Pune PMC",
    description=(
        "AI-enabled dynamic waste collection route optimization for "
        "Pune Municipal Corporation (Smart India Hackathon 2026)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all origins during development; tighten in production via env
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers — lazy-loaded data caches
# ---------------------------------------------------------------------------

_zones_cache: Optional[dict] = None
_stops_cache: Optional[list] = None


def _load_zones() -> dict:
    """Load and cache zones.geojson."""
    global _zones_cache
    if _zones_cache is None:
        if not ZONES_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail="zones.geojson not found. Run Phase 1 pipeline first.",
            )
        with open(ZONES_PATH, "r", encoding="utf-8") as f:
            _zones_cache = json.load(f)
    return _zones_cache


def _load_stops() -> list:
    """Load and cache stops.json."""
    global _stops_cache
    if _stops_cache is None:
        if not STOPS_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail="stops.json not found. Run Phase 1 pipeline first.",
            )
        with open(STOPS_PATH, "r", encoding="utf-8") as f:
            _stops_cache = json.load(f)
    return _stops_cache


def _default_date() -> str:
    """Return today's date as YYYY-MM-DD string."""
    return date.today().isoformat()


def _validate_date(date_str: str) -> str:
    """Validate and normalise a date string."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD.",
        )


# ---------------------------------------------------------------------------
# GET /api/health
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Liveness and readiness check."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        city="Pune (PMC)",
        total_wards=15,
        pipeline_phases={
            "phase1_data_ingestion": ZONES_PATH.exists() and STOPS_PATH.exists(),
            "phase2_ml_predictor": (DATA_OUTPUTS / "fill_model.joblib").exists(),
            "phase3_route_optimizer": ROUTES_PATH.exists(),
            "phase4_api_layer": True,
        },
    )


# ---------------------------------------------------------------------------
# GET /api/zones
# ---------------------------------------------------------------------------

@app.get("/api/zones", response_model=ZonesResponse, tags=["Zones"])
async def get_zones():
    """Return all 15 PMC ward boundary polygons as GeoJSON."""
    zones_data = _load_zones()
    return zones_data


# ---------------------------------------------------------------------------
# GET /api/stops?date=YYYY-MM-DD
# ---------------------------------------------------------------------------

@app.get("/api/stops", response_model=StopsResponse, tags=["Stops"])
async def get_stops(
    date: str = Query(default=None, description="Date for fill predictions (YYYY-MM-DD)"),
):
    """
    Return all collection stops with predicted fill percentages for a date.
    If no date is provided, defaults to today.
    """
    target_date = _validate_date(date) if date else _default_date()

    # Import prediction engine
    from .predict import predict_stop_fills, load_model

    stops = _load_stops()
    model = load_model()
    predictions = predict_stop_fills(target_date, stops=stops, model=model)

    return StopsResponse(
        date=target_date,
        total_stops=len(predictions),
        stops=[StopModel(**p) for p in predictions],
    )


# ---------------------------------------------------------------------------
# Background Optimization Worker & Deduplication
# ---------------------------------------------------------------------------

_active_optimization_tasks: dict[str, asyncio.Task] = {}
_executor = ThreadPoolExecutor(max_workers=2)


def _run_optimization_sync(target_date: str) -> dict:
    """Synchronous CVRP optimization run executed in thread pool."""
    from .optimize import run_full_city_optimization
    return run_full_city_optimization(target_date)


async def _get_or_schedule_optimization(
    target_date: str,
) -> tuple[Optional[dict], Optional[dict]]:
    """
    Shared deduplicated background-worker path for full city CVRP optimization.
    Executes heavy OR-Tools optimization off the event loop.

    Returns:
        (result_data, None) if completed/cached, or (None, job_status_dict) if computing.
    """
    # 1. Check disk cache
    if ROUTES_PATH.exists():
        try:
            with open(ROUTES_PATH, "r", encoding="utf-8") as f:
                cached = json.load(f)
            if cached.get("date") == target_date:
                return cached, None
        except Exception:
            pass

    # 2. Check if a background job is already in flight for this date (deduplication)
    existing_task = _active_optimization_tasks.get(target_date)
    if existing_task and not existing_task.done():
        return None, {
            "status": "in_progress",
            "date": target_date,
            "message": "Optimization job is currently in progress off the event loop.",
        }

    # 3. Schedule new optimization job off the event loop
    loop = asyncio.get_running_loop()

    async def _worker():
        try:
            return await loop.run_in_executor(_executor, _run_optimization_sync, target_date)
        finally:
            _active_optimization_tasks.pop(target_date, None)

    task = asyncio.create_task(_worker())
    _active_optimization_tasks[target_date] = task

    return None, {
        "status": "in_progress",
        "date": target_date,
        "message": "Optimization job started in background worker off the event loop.",
    }


# ---------------------------------------------------------------------------
# GET /api/routes/comparison?date=YYYY-MM-DD
# ---------------------------------------------------------------------------

@app.get(
    "/api/routes/comparison",
    response_model=Union[RoutePlanResponse, OptimizationJobStatus],
    tags=["Routes"],
)
async def get_routes_comparison(
    date: str = Query(default=None, description="Date for route optimisation (YYYY-MM-DD)"),
):
    """
    Run full static-vs-dynamic route comparison for all 15 wards.

    Returns cached RoutePlanResponse if available. On cache miss, dispatches
    optimization off the event loop in a deduplicated background worker and returns
    a 202 job-status response while work is in progress.
    """
    target_date = _validate_date(date) if date else _default_date()

    result, status_info = await _get_or_schedule_optimization(target_date)
    if result is not None:
        return result

    return JSONResponse(status_code=202, content=status_info)


# ---------------------------------------------------------------------------
# GET /api/stats/savings?date=YYYY-MM-DD
# ---------------------------------------------------------------------------

@app.get(
    "/api/stats/savings",
    response_model=Union[CitySavingsResponse, OptimizationJobStatus],
    tags=["Statistics"],
)
async def get_savings(
    date: str = Query(default=None, description="Date for savings stats (YYYY-MM-DD)"),
):
    """
    Return lightweight city-wide savings KPIs without full route data.
    Routes through the shared background worker on cache miss.
    """
    target_date = _validate_date(date) if date else _default_date()

    result, status_info = await _get_or_schedule_optimization(target_date)
    if result is not None:
        savings = result.get("city_savings", {})
        return CitySavingsResponse(
            date=target_date,
            city="Pune (PMC)",
            distance_saved_km=savings.get("distance_saved_km", 0.0),
            distance_saved_pct=savings.get("distance_saved_pct", 0.0),
            diesel_saved_litres=savings.get("diesel_saved_litres", 0.0),
            total_cost_saved_inr=savings.get("total_cost_saved_inr", 0.0),
            co2_avoided_kg=savings.get("co2_avoided_kg", 0.0),
            stops_skipped=savings.get("stops_skipped", 0),
            overflow_bins_eliminated=savings.get("overflow_delta", 0),
            total_wards=result.get("total_wards_optimized", 15),
        )

    return JSONResponse(status_code=202, content=status_info)


# ---------------------------------------------------------------------------
# GET /api/citizen/lookup?zone_id=PUNE_W01
# ---------------------------------------------------------------------------

@app.get(
    "/api/citizen/lookup",
    response_model=CitizenLookupResponse,
    tags=["Citizen"],
)
async def citizen_lookup(
    zone_id: str = Query(..., description="PMC ward zone ID (e.g. PUNE_W01)"),
):
    """
    Citizen-facing endpoint returning collection schedule,
    waste segregation guide, and nearest stop fill status for a ward.
    """
    zones_data = _load_zones()
    zone_props = None
    for feat in zones_data.get("features", []):
        if feat["properties"]["zone_id"] == zone_id:
            zone_props = feat["properties"]
            break

    if zone_props is None:
        raise HTTPException(
            status_code=404,
            detail=f"Zone '{zone_id}' not found. Valid IDs: PUNE_W01 to PUNE_W15.",
        )

    # Get fill predictions for zone stops
    stops = _load_stops()
    zone_stops = [s for s in stops if s["zone_id"] == zone_id and not s.get("is_depot")]

    # Build fill summary
    fill_summary = None
    highest_fill_stop_data = None
    if zone_stops:
        from .predict import predict_stop_fills, load_model

        today = _default_date()
        model = load_model()
        predictions = predict_stop_fills(today, stops=stops, model=model)
        zone_preds = [p for p in predictions if p["zone_id"] == zone_id]

        if zone_preds:
            fills = [p["predicted_fill_pct"] for p in zone_preds]
            fill_summary = ZoneFillSummary(
                total_stops=len(zone_preds),
                avg_fill_pct=round(sum(fills) / len(fills), 1),
                overflow_risk_count=sum(1 for f in fills if f >= 80.0),
                critical_count=sum(1 for f in fills if f >= 85.0),
            )
            # Pick the highest-fill stop to surface to citizens
            zone_preds.sort(key=lambda p: p["predicted_fill_pct"], reverse=True)
            highest_fill_stop_data = StopModel(**zone_preds[0])

    schedule = CitizenSchedule(
        zone_id=zone_id,
        ward_name=zone_props["name"],
        collection_day=zone_props["day"],
        cycle=zone_props["cycle"],
        depot_name=zone_props["depot_name"],
        next_pickup_eta=f"Next {zone_props['day']}, Morning 6:00-9:00 AM",
        highest_fill_stop=highest_fill_stop_data,
        zone_fill_summary=fill_summary,
    )

    return CitizenLookupResponse(
        zone_id=zone_id,
        schedule=schedule,
    )


# ---------------------------------------------------------------------------
# Entrypoint for `python backend/app/main.py`
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    print(f"[INFO] Starting SWM AI API server at http://{host}:{port}")
    print(f"[INFO] Swagger UI: http://localhost:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
