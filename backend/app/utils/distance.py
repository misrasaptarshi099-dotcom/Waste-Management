"""
distance.py
Haversine geodesic distance matrix computation for CVRP route optimization.

Computes pairwise distances between all active collection stops and the
ward transfer depot using the Haversine formula on WGS84 coordinates.
"""

import math
from typing import List, Tuple

# Earth's mean radius in kilometers
EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate geodesic distance between two WGS84 points using the
    Haversine formula.

    Args:
        lat1, lon1: Latitude/longitude of point A in decimal degrees.
        lat2, lon2: Latitude/longitude of point B in decimal degrees.

    Returns:
        Distance in kilometers.
    """
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def build_distance_matrix(
    coords: List[Tuple[float, float]],
) -> List[List[int]]:
    """
    Build a symmetric distance matrix from a list of (lat, lon) tuples.

    The matrix is returned with integer values in **metres** (required by
    OR-Tools routing solver, which operates on integers).

    Args:
        coords: List of (lat, lon) tuples. Index 0 is typically the depot.

    Returns:
        2D list of integer distances in metres.
    """
    n = len(coords)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            dist_km = haversine_km(
                coords[i][0], coords[i][1],
                coords[j][0], coords[j][1],
            )
            dist_m = int(round(dist_km * 1000))
            matrix[i][j] = dist_m
            matrix[j][i] = dist_m
    return matrix


def total_route_distance_km(
    route_indices: List[int],
    distance_matrix: List[List[int]],
) -> float:
    """
    Calculate total route distance in km from an ordered list of node indices.

    Args:
        route_indices: Ordered node indices (should start and end at depot = 0).
        distance_matrix: Precomputed distance matrix in metres.

    Returns:
        Total route distance in kilometres.
    """
    total_m = 0
    for k in range(len(route_indices) - 1):
        total_m += distance_matrix[route_indices[k]][route_indices[k + 1]]
    return total_m / 1000.0
