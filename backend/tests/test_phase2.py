"""
test_phase2.py
Unit tests for Phase 2: Waste Simulation & ML Prediction Pipeline.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FILL_HISTORY_PATH = BASE_DIR / "data" / "processed" / "fill_history.json"
TRAINING_DATA_PATH = BASE_DIR / "data" / "processed" / "training_data.json"
MODEL_PATH = BASE_DIR / "data" / "outputs" / "fill_model.joblib"
METRICS_PATH = BASE_DIR / "data" / "outputs" / "model_metrics.json"
PREDICTIONS_PATH = BASE_DIR / "data" / "outputs" / "sample_predictions.json"

import pytest


@pytest.mark.skipif(not FILL_HISTORY_PATH.exists(), reason="fill_history.json not generated")
def test_simulation_output():
    assert FILL_HISTORY_PATH.exists(), f"Missing {FILL_HISTORY_PATH}"
    with open(FILL_HISTORY_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    assert len(records) > 20000, f"Expected >20000 records, got {len(records)}"

    sample = records[0]
    required_keys = [
        "stop_id", "zone_id", "date", "day_of_week", "is_weekend",
        "is_festival", "is_market_day", "event_multiplier",
        "days_since_last_pickup", "commercial_flag", "fill_pct",
    ]
    for key in required_keys:
        assert key in sample, f"Missing key '{key}' in simulation record"

    fills = [r["fill_pct"] for r in records]
    assert all(0.0 <= f <= 100.0 for f in fills), "Fill values out of [0, 100] range"
    print(f"[TEST PASS] fill_history.json verified ({len(records)} records, fills in [0, 100])")


@pytest.mark.skipif(not TRAINING_DATA_PATH.exists(), reason="training_data.json not generated")
def test_training_data():
    assert TRAINING_DATA_PATH.exists(), f"Missing {TRAINING_DATA_PATH}"
    with open(TRAINING_DATA_PATH, "r", encoding="utf-8") as f:
        rows = json.load(f)

    assert len(rows) > 20000, f"Expected >20000 training rows, got {len(rows)}"

    feature_keys = [
        "days_since_last_pickup", "day_of_week", "is_weekend",
        "is_festival", "is_market_day", "commercial_flag",
        "baseline_fill_rate", "event_multiplier", "fill_pct",
    ]
    for key in feature_keys:
        assert key in rows[0], f"Missing feature '{key}'"

    print(f"[TEST PASS] training_data.json verified ({len(rows)} rows, all features present)")


@pytest.mark.skipif(not METRICS_PATH.exists(), reason="model_metrics.json not generated")
def test_model_metrics():
    assert METRICS_PATH.exists(), f"Missing {METRICS_PATH}"
    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    assert metrics["test_r2"] > 0.50, f"Test R2 too low: {metrics['test_r2']}"
    assert metrics["test_rmse"] < 30.0, f"Test RMSE too high: {metrics['test_rmse']}"
    assert "feature_importances" in metrics
    print(f"[TEST PASS] Model metrics verified (R2={metrics['test_r2']}, RMSE={metrics['test_rmse']})")


@pytest.mark.skipif(not MODEL_PATH.exists(), reason="fill_model.joblib not generated")
def test_model_exists():
    assert MODEL_PATH.exists(), f"Missing trained model at {MODEL_PATH}"
    print(f"[TEST PASS] Trained model file exists at {MODEL_PATH}")


@pytest.mark.skipif(not PREDICTIONS_PATH.exists(), reason="sample_predictions.json not generated")
def test_sample_predictions():
    assert PREDICTIONS_PATH.exists(), f"Missing {PREDICTIONS_PATH}"
    with open(PREDICTIONS_PATH, "r", encoding="utf-8") as f:
        preds = json.load(f)

    assert len(preds) > 300, f"Expected >300 predictions, got {len(preds)}"
    sample = preds[0]
    required_keys = [
        "stop_id", "zone_id", "predicted_fill_pct", "urgency",
        "is_overflow_risk", "lat", "lon",
    ]
    for key in required_keys:
        assert key in sample, f"Missing key '{key}' in prediction"

    fills = [p["predicted_fill_pct"] for p in preds]
    assert all(0.0 <= f <= 100.0 for f in fills), "Predicted fills out of [0, 100]"
    print(f"[TEST PASS] sample_predictions.json verified ({len(preds)} stops predicted)")


if __name__ == "__main__":
    test_simulation_output()
    test_training_data()
    test_model_exists()
    test_model_metrics()
    test_sample_predictions()
    print("[ALL PHASE 2 TESTS PASSED SUCCESSFULLY]")
