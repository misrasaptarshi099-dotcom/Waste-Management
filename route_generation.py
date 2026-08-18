import geopandas as gpd
import numpy as np
from shapely.geometry import Point
import matplotlib.pyplot as plt
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

#Load and prepare data

gdf = gpd.read_file("pune-admin-wards_2017.geojson")

gdf['geometry'] = gdf.buffer(0)

gdf = gdf.to_crs(epsg=32643) 
ward = gdf.iloc[0]

#Safe random point generator
def random_points_in_polygon(polygon, n, max_attempts=10000):
    minx, miny, maxx, maxy = polygon.bounds
    points = []
    attempts = 0

    while len(points) < n and attempts < max_attempts:
        p = Point(np.random.uniform(minx, maxx),
                  np.random.uniform(miny, maxy))
        if polygon.contains(p):
            points.append(p)
        attempts += 1

    if len(points) < n:
        print("⚠️ Could only generate", len(points), "points")

    return points


sub_points = random_points_in_polygon(ward.geometry, 8)
print("Generated points:", len(sub_points))

#Convert to coordinates
coords = [(p.x, p.y) for p in sub_points]

#Distance matrix
def euclidean_distance(p1, p2):
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

n = len(coords)
distance_matrix = np.zeros((n, n))

for i in range(n):
    for j in range(n):
        distance_matrix[i][j] = euclidean_distance(coords[i], coords[j])

def solve_tsp(distance_matrix):
    manager = pywrapcp.RoutingIndexManager(len(distance_matrix), 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        return int(distance_matrix[
            manager.IndexToNode(from_index)][manager.IndexToNode(to_index)] * 1000)

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)

    solution = routing.SolveWithParameters(search_parameters)

    if solution is None:
        print("No solution found!")
        return []

    route = []
    index = routing.Start(0)

    while not routing.IsEnd(index):
        route.append(manager.IndexToNode(index))
        index = solution.Value(routing.NextVar(index))

    route.append(manager.IndexToNode(index))

    return route

route = solve_tsp(distance_matrix)
print("Route:", route)

#Plot result
plt.figure(figsize=(7, 7))

x = [p[0] for p in coords]
y = [p[1] for p in coords]
plt.scatter(x, y)

for i, (x_i, y_i) in enumerate(coords):
    plt.text(x_i, y_i, f"P{i}", fontsize=10, ha='right')

if route:
    for i in range(len(route)-1):
        p1 = coords[route[i]]
        p2 = coords[route[i+1]]

        
        plt.plot([p1[0], p2[0]], [p1[1], p2[1]])

        
        mid_x = (p1[0] + p2[0]) / 2
        mid_y = (p1[1] + p2[1]) / 2

        # Sequence number
        plt.text(mid_x, mid_y, f"{i+1}", color='red', fontsize=9)

start = coords[route[0]]
plt.scatter(start[0], start[1], s=100, marker='*')
plt.text(start[0], start[1], "START", fontsize=12)

plt.title("Optimized Delivery Route with Sequence")
plt.xlabel("X")
plt.ylabel("Y")
plt.show()