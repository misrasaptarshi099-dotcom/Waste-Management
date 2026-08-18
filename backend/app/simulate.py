"""
simulate.py
Phase 2A: Non-linear waste accumulation simulator using Poisson processes
with Indian civic event multipliers (festivals, weekly mandis, weekends).

Generates 60-day time-series training data for each stop, incorporating
ward-specific population density scaling, commercial zone multipliers,
and cultural event surges (Ganesh Utsav, Diwali, weekly Subzi Mandis).
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STOPS_PATH = BASE_DIR / "data" / "processed" / "stops.json"
SIMULATION_OUTPUT_PATH = BASE_DIR / "data" / "processed" / "fill_history.json"
TRAINING_CSV_PATH = BASE_DIR / "data" / "processed" / "training_data.json"

# ---------------------------------------------------------------------------
# Indian Civic Event Calendar (2026 reference dates)
# ---------------------------------------------------------------------------
INDIAN_FESTIVALS = {
    "Ganesh Chaturthi": {"start": "2026-08-22", "end": "2026-09-01", "multiplier": 3.2},
    "Navratri": {"start": "2026-10-01", "end": "2026-10-10", "multiplier": 2.5},
    "Dussehra": {"start": "2026-10-11", "end": "2026-10-12", "multiplier": 2.8},
    "Diwali": {"start": "2026-10-29", "end": "2026-11-02", "multiplier": 3.5},
    "Eid ul-Fitr": {"start": "2026-03-20", "end": "2026-03-22", "multiplier": 2.6},
    "Holi": {"start": "2026-03-03", "end": "2026-03-04", "multiplier": 2.4},
    "Republic Day": {"start": "2026-01-26", "end": "2026-01-26", "multiplier": 1.8},
    "Independence Day": {"start": "2026-08-15", "end": "2026-08-15", "multiplier": 1.8},
    "Makar Sankranti": {"start": "2026-01-14", "end": "2026-01-15", "multiplier": 2.0},
}

# Weekly market days (Subzi Mandi / Haat) -- typically Wed & Sun in Pune
WEEKLY_MARKET_DAYS = {2, 6}  # 0=Mon, 2=Wed, 6=Sun


def _parse_date(s: str) -> datetime:
    return datetime.strptime(s, "%Y-%m-%d")


def get_event_multiplier(date: datetime) -> tuple:
    """
    Return (multiplier: float, event_name: str | None) for a given date.
    Checks Indian festivals first, then weekly market days, then weekends.
    """
    # Check festivals
    for name, info in INDIAN_FESTIVALS.items():
        start = _parse_date(info["start"])
        end = _parse_date(info["end"])
        if start <= date <= end:
            return info["multiplier"], name

    # Check weekly market days (Subzi Mandi / Haat)
    if date.weekday() in WEEKLY_MARKET_DAYS:
        return 2.2, "Weekly Subzi Mandi"

    # Weekend bump
    if date.weekday() in (5, 6):  # Saturday, Sunday
        return 1.3, "Weekend"

    return 1.0, None


def compute_density_factor(population_density: float) -> float:
    """Scale base accumulation rate by ward population density."""
    # Normalised around median Pune density (~13000 persons/km2)
    return 0.7 + 0.6 * min(population_density / 20000.0, 1.0)


def simulate_fill_history(
    stops: list,
    n_days: int = 60,
    start_date: Optional[datetime] = None,
    seed: int = 42,
) -> list:
    """
    Simulate n_days of waste accumulation for every stop.

    Mathematical model per stop i on day t:
        lambda_i_t = base_rate * density_factor * commercial_mult * event_mult(t)
        delta_waste ~ Poisson(lambda_i_t)
        fill_t = clamp(0, 100, fill_{t-1} + delta_waste - collected * fill_{t-1})

    Collection happens on the ward's scheduled day under the static baseline.
    """
    np.random.seed(seed)
    random.seed(seed)

    if start_date is None:
        start_date = datetime(2026, 7, 1)

    # Build zone -> scheduled day mapping from stops
    zone_day_map = {}
    for s in stops:
        zid = s["zone_id"]
        if zid not in zone_day_map:
            idx = int(zid.split("W")[1]) - 1
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            zone_day_map[zid] = days[idx % len(days)]

    day_name_to_int = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2,
        "Thursday": 3, "Friday": 4, "Saturday": 5,
    }

    records = []

    for stop in stops:
        if stop.get("is_depot"):
            continue

        sid = stop["stop_id"]
        zid = stop["zone_id"]
        base_rate = stop.get("baseline_fill_rate", 18.0)
        is_commercial = stop.get("commercial_flag", False)
        capacity_kg = stop.get("bin_capacity_kg", 400)

        density = 13000
        density_factor = compute_density_factor(density)
        commercial_mult = 1.6 if is_commercial else 1.0

        fill_pct = random.uniform(5.0, 35.0)
        last_collected_day = -1

        scheduled_weekday = day_name_to_int.get(zone_day_map.get(zid, "Monday"), 0)

        for day_offset in range(n_days):
            current_date = start_date + timedelta(days=day_offset)
            current_weekday = current_date.weekday()

            event_mult, event_name = get_event_multiplier(current_date)

            collected = False
            if current_weekday == scheduled_weekday:
                collected = True

            lam = (base_rate / 100.0) * density_factor * commercial_mult * event_mult
            lam = max(lam, 0.01)
            delta_pct = np.random.poisson(lam * 100) / 100.0 * 100

            delta_pct = min(delta_pct, 45.0)

            if collected:
                fill_pct = random.uniform(2.0, 8.0)
                days_since_pickup = 0
            else:
                fill_pct = fill_pct + delta_pct
                days_since_pickup = day_offset - last_collected_day if last_collected_day >= 0 else day_offset + 1

            fill_pct = max(0.0, min(100.0, fill_pct))

            if collected:
                last_collected_day = day_offset

            record = {
                "stop_id": sid,
                "zone_id": zid,
                "date": current_date.strftime("%Y-%m-%d"),
                "day_of_week": current_weekday,
                "is_weekend": 1 if current_weekday in (5, 6) else 0,
                "is_festival": 1 if (event_name and event_name not in ("Weekend", "Weekly Subzi Mandi")) else 0,
                "is_market_day": 1 if event_name == "Weekly Subzi Mandi" else 0,
                "event_name": event_name,
                "event_multiplier": round(event_mult, 2),
                "days_since_last_pickup": min(days_since_pickup, 7),
                "commercial_flag": 1 if is_commercial else 0,
                "baseline_fill_rate": base_rate,
                "bin_capacity_kg": capacity_kg,
                "fill_pct": round(fill_pct, 1),
                "was_collected": 1 if collected else 0,
            }
            records.append(record)

    return records


def build_training_features(records: list) -> list:
    """Transform raw simulation records into ML-ready feature vectors."""
    training_rows = []
    for r in records:
        row = {
            "days_since_last_pickup": r["days_since_last_pickup"],
            "day_of_week": r["day_of_week"],
            "is_weekend": r["is_weekend"],
            "is_festival": r["is_festival"],
            "is_market_day": r["is_market_day"],
            "commercial_flag": r["commercial_flag"],
            "baseline_fill_rate": r["baseline_fill_rate"],
            "event_multiplier": r["event_multiplier"],
            "fill_pct": r["fill_pct"],
        }
        training_rows.append(row)
    return training_rows


def run_simulation():
    """Entry point: load stops, simulate 60 days, export training data."""
    with open(STOPS_PATH, "r", encoding="utf-8") as f:
        stops = json.load(f)

    print(f"[INFO] Loaded {len(stops)} stops from {STOPS_PATH}")

    records = simulate_fill_history(stops, n_days=60)
    print(f"[INFO] Generated {len(records)} daily fill observations across 60 days")

    with open(SIMULATION_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"[SUCCESS] Saved fill history to {SIMULATION_OUTPUT_PATH}")

    training = build_training_features(records)
    with open(TRAINING_CSV_PATH, "w", encoding="utf-8") as f:
        json.dump(training, f, indent=2)
    print(f"[SUCCESS] Saved {len(training)} training rows to {TRAINING_CSV_PATH}")

    fills = [r["fill_pct"] for r in records]
    print(f"[STATS] Fill % range: {min(fills):.1f} - {max(fills):.1f}")
    print(f"[STATS] Mean fill: {sum(fills)/len(fills):.1f}%")
    overflow_count = sum(1 for f in fills if f >= 90.0)
    print(f"[STATS] Overflow events (>=90%): {overflow_count} ({100*overflow_count/len(fills):.1f}%)")

    return records, training


if __name__ == "__main__":
    run_simulation()
