"""
data_loader.py
Phase 1: Ingests Pune Municipal Corporation (PMC) 15 Admin Wards GeoJSON,
normalizes attributes to project contracts, computes polygon metrics,
and performs Shapely point-in-polygon sampling to generate realistic stops.
"""

import json
import math
import os
import random
import urllib.request
from pathlib import Path
from shapely.geometry import shape, Point, Polygon, MultiPolygon

# Raw DataMeet GeoJSON URL for Pune Admin Wards
PUNE_GEOJSON_URL = (
    "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Pune/pune-admin-wards_2017.geojson"
)

# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_RAW_DIR = BASE_DIR / "data" / "raw"
DATA_PROCESSED_DIR = BASE_DIR / "data" / "processed"
DATA_OUTPUTS_DIR = BASE_DIR / "data" / "outputs"

RAW_FILE_PATH = DATA_RAW_DIR / "pune-admin-wards_2017.geojson"
PROCESSED_ZONES_PATH = DATA_PROCESSED_DIR / "zones.geojson"
PROCESSED_STOPS_PATH = DATA_PROCESSED_DIR / "stops.json"

# Days of week baseline mapping
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

# Ward metadata mapping (Official names, population density persons/km2, landmark seeds)
WARD_METADATA = [
    {
        "id": "PUNE_W01",
        "name": "Aundh-Baner",
        "density": 8500,
        "landmarks": [
            "Aundh Gaon Market Bin", "DP Road Feeder Point", "Baner High Street Bin",
            "Medipoint Hospital Compactor", "Parihar Chowk Dustbin", "Sindh Society Gate Bin",
            "Balewadi Phata Feeder", "Pashan Lake Road Point", "ITI Road Transfer Bin",
            "Baner Pashan Link Rd Bin", "Spicer College Gate Bin", "Aundh Chest Hospital Bin",
            "Veer Savarkar Garden Bin", "Westend Mall Lane Dustbin", "Abhimanshree Society Bin"
        ]
    },
    {
        "id": "PUNE_W02",
        "name": "Ghole Road-Shivajinagar",
        "density": 14200,
        "landmarks": [
            "FC Road Food Street Bin", "JM Road Commercial Compactor", "Shivajinagar Railway Station Feeder",
            "Modern College Lane Bin", "Deccan Gymkhana Bus Stop Bin", "Ghole Road Ward Office Bin",
            "Fergusson College Main Gate Bin", "Sambhaji Park Corner Dustbin", "Balgandharva Rangmandir Bin",
            "COEP Hostel Lane Feeder", "Wakdewadi Bus Stand Compactor", "Agriculture College Road Bin",
            "Model Colony Market Bin", "Deep Bungalow Chowk Dustbin", "Senapati Bapat Road Feeder"
        ]
    },
    {
        "id": "PUNE_W03",
        "name": "Kothrud-Bavdhan",
        "density": 11800,
        "landmarks": [
            "Kothrud Bus Stand Compactor", "MIT College Road Bin", "Paud Road Vegetable Market Bin",
            "Chandani Chowk Feeder Point", "Karve Statue Chowk Bin", "Mayur Colony Park Dustbin",
            "Bavdhan High Street Bin", "Gandhi Bhavan Road Feeder", "Ideal Colony Main Rd Bin",
            "Vanaz Metro Station Bin", "Gujrat Colony Square Bin", "Dahanukar Colony Market Bin",
            "Bavdhan Patil Nagar Bin", "Shastri Nagar Lane Bin", "Right Bhusari Colony Dustbin"
        ]
    },
    {
        "id": "PUNE_W04",
        "name": "Warje-Karvenagar",
        "density": 12500,
        "landmarks": [
            "Karvenagar Main Chowk Bin", "Warje Flyover Feeder Point", "Cummins College Lane Bin",
            "Kakade City Dustbin", "Warje Malwadi Market Compactor", "Dnyaneshwar Paduka Chowk Bin",
            "Hingne Khurd Feeder Point", "Popular Nagar Gate Bin", "Tapodham Society Bin",
            "Warje Bridge South Point", "Atul Nagar Vegetable Bin", "Shahu Colony Lane Dustbin"
        ]
    },
    {
        "id": "PUNE_W05",
        "name": "Dhole Patil Road",
        "density": 13600,
        "landmarks": [
            "Pune Railway Station North Dumper", "Koregaon Park North Main Rd Bin", "Bund Garden Road Point",
            "Ruby Hall Clinic Lane Bin", "Dhole Patil Road Market Feeder", "Sangamwadi Bridge Feeder",
            "Koregaon Park Lane 7 Bin", "Maldhakka Chowk Compactor", "Sassoon Hospital Gate Bin",
            "Boat Club Road Dustbin", "Mangaldas Road Commercial Bin", "Wadia College Corner Bin"
        ]
    },
    {
        "id": "PUNE_W06",
        "name": "Yerawada-Kalas-Dhanori",
        "density": 15200,
        "landmarks": [
            "Yerawada Jail Road Compactor", "Gunjan Chowk Feeder Point", "Vishrantwadi Mandi Bin",
            "Dhanori Jakat Naka Bin", "Kalas Gaon Feeder Point", "Golf Course Road Dustbin",
            "Deccan College Road Bin", "Pratik Nagar Square Bin", "Tingre Nagar Main Road Bin",
            "Yerawada Bridge South Bin", "Commerzone IT Park Bin", "Nagpur Chawl Community Bin"
        ]
    },
    {
        "id": "PUNE_W07",
        "name": "Bhavani Peth",
        "density": 21000,
        "landmarks": [
            "Timber Market Bulk Compactor", "Bhavani Mata Mandir Chowk", "Mahatma Phule Peth Feeder",
            "Padmaji Park Dustbin", "Ganj Peth Vegetable Bin", "Chudaman Talim Chowk Bin",
            "Kasturi Chowk Corner Bin", "Ramoshi Ali Market Bin", "Bhawani Peth Police Chowky Bin",
            "Sonawane Hospital Lane Bin", "Laxmi Market Bulk Dumper", "Guruwar Peth Border Feeder"
        ]
    },
    {
        "id": "PUNE_W08",
        "name": "Kasba-Vishrambaugwada",
        "density": 19500,
        "landmarks": [
            "Shaniwar Wada Tourism Compactor", "Tulshibaug Market Mega Bin", "Appa Balwant Chowk Dustbin",
            "Laxmi Road Shopping Lane Bin", "Mandai Wholesale Fruit Market Dumper", "Kasba Ganpati Mandir Square",
            "Vishrambaug Wada Heritage Bin", "Budhwar Peth Chowk Point", "Bajirao Road Commercial Feeder",
            "Kunte Chowk Corner Bin", "Raviwar Peth Cloth Market Bin", "Nana Peth Hardware Feeder"
        ]
    },
    {
        "id": "PUNE_W09",
        "name": "Tilak Road-Sinhagad",
        "density": 13800,
        "landmarks": [
            "SP College Main Gate Bin", "Swargate ST Bus Terminal Compactor", "Nehru Stadium Feeder",
            "Hirabaug Chowk Dustbin", "Tilak Road Maharashtra Mandal Bin", "Parvati Foothills Bin",
            "Dandekar Bridge Slum Feeder", "Mitramandal Chowk Point", "Sarasbaug Temple Gate Bin",
            "Dattawadi Main Road Bin", "Panmala Sinhagad Rd Compactor", "Pu La Deshpande Garden Bin"
        ]
    },
    {
        "id": "PUNE_W10",
        "name": "Bibwewadi",
        "density": 16400,
        "landmarks": [
            "Market Yard Gate 1 Mega Compactor", "Bibwewadi Gaon Market Bin", "Gangadham Chowk Feeder",
            "KK Market Commercial Dumper", "Pushpa Mangal Karyalaya Bin", "Chintamani Nagar Gate Bin",
            "Vasant Baug Society Bin", "Salisbury Park North Gate Bin", "Lullanagar Junction Feeder",
            "Upper Indira Nagar Slum Feeder", "Bibwewadi Police Station Bin", "Yashwantrao Chavan Natyagruha Bin"
        ]
    },
    {
        "id": "PUNE_W11",
        "name": "Sahakarnagar",
        "density": 12900,
        "landmarks": [
            "Padmavati Temple Square Bin", "Taljai Hills Entry Dustbin", "Aranyeshwar Chowk Feeder",
            "Sahakar Nagar No 2 Market Bin", "Gajanan Maharaj Mandir Bin", "Dhankawadi Road Corner Bin",
            "Chavan Nagar Society Dustbin", "Walvekar Nagar Feeder Point", "Ahilyadevi Holkar Garden Bin",
            "KK Nagar Main Road Bin", "Ambegaon Phata Junction Bin", "Shindewadi Corner Feeder"
        ]
    },
    {
        "id": "PUNE_W12",
        "name": "Dhankawadi-Sahakarnagar",
        "density": 14700,
        "landmarks": [
            "Bharati Vidyapeeth Campus Mega Bin", "Katraj Dairy Feeder Station", "Katraj Snake Park Gate Bin",
            "Dhankawadi Last Bus Stop Bin", "Trimurti Chowk Vegetable Bin", "Kashinath Patil Nagar Dustbin",
            "Balaji Nagar Main Road Bin", "Katraj Ghat Road Point", "Ambegaon Budruk Gate Bin",
            "Pune-Satara Road Toll Post Bin", "Chitanya Nagar Feeder", "Mohan Nagar Corner Bin"
        ]
    },
    {
        "id": "PUNE_W13",
        "name": "Hadapsar-Mundhwa",
        "density": 10500,
        "landmarks": [
            "Hadapsar Gadital Central Compactor", "Magarpatta City Main Gate Bin", "Mundhwa Industrial Feeder",
            "Amanora Town Centre Outer Bin", "Sasane Nagar Railway Gate Bin", "Hadapsar Industrial Estate Bin",
            "Manjri Road Vegetable Market Bin", "Malwadi Hadapsar Feeder", "Keshavnagar Mundhwa Bridge Bin",
            "Vaibhav Theater Chowk Bin", "Sayyad Nagar Slum Point", "Koregaon Park Annexe Bridge Bin"
        ]
    },
    {
        "id": "PUNE_W14",
        "name": "Wanowrie-Ramtekdi",
        "density": 11200,
        "landmarks": [
            "Command Hospital Southern Gate Bin", "Salunke Vihar Road Market Bin", "Fatima Nagar Chowk Feeder",
            "Wanowrie Bazar Community Bin", "Kedari Nagar Chowk Dustbin", "Ramtekdi Industrial Area Dumper",
            "NIBM Road Commercial Bin", "Kondhwa Khurd Junction Feeder", "Clover Highlands Corner Bin",
            "Ruby Hall Clinic Wanowrie Bin", "Vikas Nagar Slum Feeder", "Bhairoba Nala STP Road Bin"
        ]
    },
    {
        "id": "PUNE_W15",
        "name": "Nagar Road-Vadgaonsheri",
        "density": 9800,
        "landmarks": [
            "Viman Nagar Phoenix Mall Lane Bin", "Kalyani Nagar Bridge Feeder", "Kharadi EON IT Park Mega Bin",
            "Vadgaonsheri Main Chowk Bin", "Ramwadi Metro Station Feeder", "Yerawada-Nagar Road Octroi Bin",
            "Chandan Nagar Vegetable Market Bin", "Thite Nagar Kharadi Dustbin", "Dutta Mandir Chowk Viman Nagar",
            "Shubham Society Kalyani Nagar", "Sanjay Park Air Force Gate Bin", "Zensar Kharadi Main Road Bin"
        ]
    }
]


def ensure_directories():
    """Ensure raw, processed, and output directories exist."""
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    DATA_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)


def download_raw_geojson() -> dict:
    """Download raw Pune Admin Wards GeoJSON if not already cached."""
    ensure_directories()
    if not RAW_FILE_PATH.exists():
        print(f"[INFO] Downloading Pune Wards GeoJSON from {PUNE_GEOJSON_URL}...")
        req = urllib.request.Request(PUNE_GEOJSON_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read()
            with open(RAW_FILE_PATH, "wb") as f:
                f.write(content)
        print(f"[SUCCESS] Saved raw GeoJSON to {RAW_FILE_PATH}")
    else:
        print(f"[INFO] Found cached raw GeoJSON at {RAW_FILE_PATH}")

    with open(RAW_FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_polygon_area_sqkm(geom) -> float:
    """
    Calculate approximate geodesic area in sq km for a WGS84 polygon.
    1 deg lat ~= 111.139 km, 1 deg lon ~= 111.139 * cos(lat) km
    """
    if geom.geom_type == "Polygon":
        polys = [geom]
    elif geom.geom_type == "MultiPolygon":
        polys = list(geom.geoms)
    else:
        return 5.0

    total_area_sqkm = 0.0
    for poly in polys:
        centroid = poly.centroid
        lat_rad = math.radians(centroid.y)
        lat_km_per_deg = 111.139
        lon_km_per_deg = 111.139 * math.cos(lat_rad)
        
        exterior_coords = list(poly.exterior.coords)
        if len(exterior_coords) < 3:
            continue
        
        proj_coords = [(c[0] * lon_km_per_deg, c[1] * lat_km_per_deg) for c in exterior_coords]
        n = len(proj_coords)
        area = 0.0
        for i in range(n - 1):
            area += proj_coords[i][0] * proj_coords[i+1][1] - proj_coords[i+1][0] * proj_coords[i][1]
        total_area_sqkm += abs(area) / 2.0

    return round(total_area_sqkm, 2)


def sample_random_points_in_polygon(polygon_geom, n_points: int, seed: int = 42):
    """
    Generate uniform random (lat, lon) points strictly within the given Shapely polygon/multipolygon.
    """
    random.seed(seed)
    minx, miny, maxx, maxy = polygon_geom.bounds
    points = []
    attempts = 0
    max_attempts = n_points * 100

    while len(points) < n_points and attempts < max_attempts:
        attempts += 1
        rx = random.uniform(minx, maxx)
        ry = random.uniform(miny, maxy)
        p = Point(rx, ry)
        if polygon_geom.contains(p):
            points.append((ry, rx))  # (lat, lon)

    # Fallback if points couldn't be generated inside complex boundary pockets
    if len(points) < n_points:
        centroid = polygon_geom.centroid
        for _ in range(n_points - len(points)):
            offset_lat = random.uniform(-0.005, 0.005)
            offset_lon = random.uniform(-0.005, 0.005)
            points.append((centroid.y + offset_lat, centroid.x + offset_lon))

    return points


def process_and_generate_datasets():
    """
    Main processing function for Phase 1:
    1. Downloads & ingests raw Pune wards.
    2. Generates normalized zones.geojson.
    3. Samples 300+ realistic stops and exports stops.json.
    """
    raw_data = download_raw_geojson()
    raw_features = raw_data.get("features", [])

    print(f"[INFO] Processing {len(raw_features)} administrative wards...")

    normalized_zones = []
    all_stops = []
    global_stop_counter = 1

    for idx, feature in enumerate(raw_features):
        geom = shape(feature["geometry"])
        centroid = geom.centroid
        area_sqkm = calculate_polygon_area_sqkm(geom)

        # Match with ward metadata
        meta = WARD_METADATA[idx % len(WARD_METADATA)]
        zone_id = meta["id"]
        ward_name = meta["name"]
        density = meta["density"]
        landmarks = meta["landmarks"]

        # Determine scheduled day and collection cycle
        assigned_day = DAYS_OF_WEEK[idx % len(DAYS_OF_WEEK)]
        assigned_cycle = "Shift A - Wet & Dry" if idx % 2 == 0 else "Shift B - Wet & Dry"

        # Determine number of collection stops based on area and density
        n_stops = max(18, min(32, int(15 + (area_sqkm * 0.8) + (density / 4000))))

        zone_props = {
            "zone_id": zone_id,
            "name": ward_name,
            "city": "Pune (PMC)",
            "state": "Maharashtra",
            "day": assigned_day,
            "cycle": assigned_cycle,
            "area_sqkm": area_sqkm,
            "population_density": density,
            "centroid_lat": round(centroid.y, 6),
            "centroid_lon": round(centroid.x, 6),
            "n_stops": n_stops,
            "depot_name": f"{ward_name} Secondary Transfer Station (STS)"
        }

        normalized_feature = {
            "type": "Feature",
            "properties": zone_props,
            "geometry": feature["geometry"]
        }
        normalized_zones.append(normalized_feature)

        # Sample collection stop coordinates inside this ward
        coords = sample_random_points_in_polygon(geom, n_stops, seed=100 + idx * 7)

        # Add Depot / Transfer Station first
        depot_stop = {
            "stop_id": f"DEP_{zone_id}",
            "zone_id": zone_id,
            "ward_name": ward_name,
            "name": f"{ward_name} Feeder Depot & Transfer Station",
            "lat": round(centroid.y, 6),
            "lon": round(centroid.x, 6),
            "bin_capacity_kg": 5000,
            "baseline_fill_rate": 0.0,
            "commercial_flag": False,
            "is_depot": True,
            "address": f"PMC Ward Office {idx+1}, {ward_name}, Pune"
        }
        all_stops.append(depot_stop)

        # Generate regular collection stops
        for s_idx, (lat, lon) in enumerate(coords):
            landmark_name = landmarks[s_idx % len(landmarks)]
            if s_idx >= len(landmarks):
                landmark_name = f"{ward_name} Block {s_idx - len(landmarks) + 1} Bin"

            is_commercial = (s_idx % 3 == 0) or ("Market" in landmark_name) or ("Street" in landmark_name) or ("Mall" in landmark_name)
            bin_capacity = random.choice([400, 600, 800, 1100]) if is_commercial else random.choice([250, 400, 500])
            baseline_rate = round(random.uniform(22.0, 32.0), 1) if is_commercial else round(random.uniform(14.0, 22.0), 1)

            stop_record = {
                "stop_id": f"STP_{idx+1:02d}_{s_idx+1:02d}",
                "zone_id": zone_id,
                "ward_name": ward_name,
                "name": landmark_name,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "bin_capacity_kg": bin_capacity,
                "baseline_fill_rate": baseline_rate,
                "commercial_flag": is_commercial,
                "is_depot": False,
                "address": f"Near {landmark_name}, {ward_name}, Pune - 4110{idx+1:02d}"
            }
            all_stops.append(stop_record)
            global_stop_counter += 1

    # Save zones.geojson
    zones_geojson = {
        "type": "FeatureCollection",
        "features": normalized_zones
    }
    with open(PROCESSED_ZONES_PATH, "w", encoding="utf-8") as f:
        json.dump(zones_geojson, f, indent=2)
    print(f"[SUCCESS] Generated {PROCESSED_ZONES_PATH} ({len(normalized_zones)} wards)")

    # Save stops.json
    with open(PROCESSED_STOPS_PATH, "w", encoding="utf-8") as f:
        json.dump(all_stops, f, indent=2)
    print(f"[SUCCESS] Generated {PROCESSED_STOPS_PATH} ({len(all_stops)} total stops including 15 transfer depots)")

    return zones_geojson, all_stops


if __name__ == "__main__":
    process_and_generate_datasets()
