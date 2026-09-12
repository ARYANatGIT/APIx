"""
AirSetu MoSPI APIx - Airport Substitution Intelligence & Scenario Simulation Engine
Author: AirSetu Engineering / MoSPI CPI Augmentation Suite

Provides:
1. Dynamic Catchment-Area Airport Substitution Matrix:
   Evaluates fare arbitrage, travel time trade-offs, and Substitution Viability Index (SVI).
   Primary vs Secondary Hubs:
   - Goa: GOI (Dabolim) vs GOX (Manohar Int'l, Mopa)
   - Mumbai: BOM (CSMI) vs PNQ (Pune) / NMI (Navi Mumbai)
   - Delhi NCR: DEL (IGI) vs HDO (Hindon) / DXN (Jewar)
   - Bengaluru: BLR (Kempegowda) vs MYQ (Mysuru)
   - Kolkata: CCU (NSCB) vs RDP (Durgapur)

2. Interactive Airport Disruption & What-If Simulator:
   Simulates capacity cuts, fog/smog disruptions, and demand surges to project
   simulated fare shocks, shocked RSI scores, and passenger spillover.
"""

import math
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from backend.mongo import get_mongo_db
from backend.index_calculator import BASE_FARES, ROUTE_WEIGHTS
from backend.route_stress_index import compute_route_stress_index

# Substitution Hub Registry with ground transit distance and connectivity
AIRPORT_SUBSTITUTION_REGISTRY = [
    {
        "id": "GOA_PAIR",
        "region": "Goa & Konkan Coastal Hub",
        "primary_code": "GOI",
        "primary_name": "Dabolim Airport (South Goa)",
        "substitute_code": "GOX",
        "substitute_name": "Manohar International Airport (Mopa, North Goa)",
        "corridor_base_route": "BOM-GOI",
        "surface_distance_km": 54,
        "transit_time_mins": 75,
        "transit_cost_inr": 1200,
        "substitute_discount_factor": 0.82,  # Typically 18% lower airport development fee / promotional carrier fares
        "best_for": "North Goa beaches (Morjim, Calangute, Arambol, Anjuna)",
        "frequency_share_pct": 42
    },
    {
        "id": "MUMBAI_PUNE_PAIR",
        "region": "Mumbai Metropolitan & Western Maharashtra",
        "primary_code": "BOM",
        "primary_name": "Chhatrapati Shivaji Maharaj Int'l (Mumbai)",
        "substitute_code": "PNQ",
        "substitute_name": "Pune International Airport (Lohegaon)",
        "corridor_base_route": "BOM-BLR",
        "surface_distance_km": 148,
        "transit_time_mins": 150,
        "transit_cost_inr": 1800,
        "substitute_discount_factor": 0.78,  # Pune flights average 22% lower during peak Mumbai congestion
        "best_for": "Navi Mumbai, Thane, Pune IT corridor, and Western Ghats",
        "frequency_share_pct": 35
    },
    {
        "id": "DELHI_NCR_PAIR",
        "region": "National Capital Region (NCR) & Western UP",
        "primary_code": "DEL",
        "primary_name": "Indira Gandhi International (New Delhi)",
        "substitute_code": "HDO",
        "substitute_name": "Hindon Civil Terminal (Ghaziabad / NCR East)",
        "corridor_base_route": "DEL-BOM",
        "surface_distance_km": 42,
        "transit_time_mins": 60,
        "transit_cost_inr": 800,
        "substitute_discount_factor": 0.85,  # Regional connectivity scheme & regional jet savings
        "best_for": "Noida, Greater Noida, Ghaziabad, East Delhi commuters",
        "frequency_share_pct": 18
    },
    {
        "id": "BENGALURU_MYSURU_PAIR",
        "region": "South Karnataka Technology Corridor",
        "primary_code": "BLR",
        "primary_name": "Kempegowda International Airport (Bengaluru)",
        "substitute_code": "MYQ",
        "substitute_name": "Mysuru Domestic Airport (Mandakalli)",
        "corridor_base_route": "BLR-HYD",
        "surface_distance_km": 170,
        "transit_time_mins": 110,  # 1h 50m via Bengaluru-Mysuru Expressway
        "transit_cost_inr": 1600,
        "substitute_discount_factor": 0.80,
        "best_for": "South Bengaluru, Electronic City, and Mysuru heritage/industrial belt",
        "frequency_share_pct": 14
    },
    {
        "id": "KOLKATA_DURGAPUR_PAIR",
        "region": "West Bengal & Asansol Industrial Belt",
        "primary_code": "CCU",
        "primary_name": "Netaji Subhash Chandra Bose Int'l (Kolkata)",
        "substitute_code": "RDP",
        "substitute_name": "Kazi Nazrul Islam Airport (Andal / Durgapur)",
        "corridor_base_route": "DEL-CCU",
        "surface_distance_km": 185,
        "transit_time_mins": 160,
        "transit_cost_inr": 1500,
        "substitute_discount_factor": 0.84,
        "best_for": "Durgapur, Asansol, Bardhaman, Dhanbad travelers",
        "frequency_share_pct": 20
    }
]


def get_airport_substitution_intelligence(db=None) -> Dict[str, Any]:
    """
    Computes real-time airport substitution intelligence comparing primary vs secondary hubs.
    Uses dynamic microdata price quotes from MongoDB to establish real fare benchmarks.
    """
    if db is None:
        db = get_mongo_db()

    # Ingest route fare benchmarks
    quotes = list(db.price_quotes.find({"is_outlier": {"$ne": True}}))
    route_fares: Dict[str, List[float]] = {}
    for q in quotes:
        r = q.get("route")
        f = float(q.get("total_fare", 0))
        if r and f > 0:
            route_fares.setdefault(r, []).append(f)

    avg_route_fare: Dict[str, float] = {}
    for r, fares in route_fares.items():
        avg_route_fare[r] = sum(fares) / len(fares)

    substitution_cards = []

    for item in AIRPORT_SUBSTITUTION_REGISTRY:
        base_route = item["corridor_base_route"]
        primary_avg_fare = avg_route_fare.get(base_route, BASE_FARES.get(base_route, 6500.0))

        # Dynamic substitute fare derived from carrier discount and route microdata
        substitute_avg_fare = round(primary_avg_fare * item["substitute_discount_factor"], 2)
        gross_savings = round(primary_avg_fare - substitute_avg_fare, 2)
        net_savings = round(gross_savings - item["transit_cost_inr"], 2)

        # Substitution Viability Index (SVI: 0 - 100)
        # Higher score = stronger financial & logistical rationale to substitute
        # Formula: SVI = (Net Savings / Primary Fare * 100) * 2.2 - (Transit Mins * 0.15)
        raw_svi = (net_savings / primary_avg_fare * 100.0) * 2.5 - (item["transit_time_mins"] * 0.12)
        svi_score = round(min(100.0, max(15.0, raw_svi + 35.0)), 1)

        if svi_score >= 70.0:
            viability_level = "HIGHLY VIABLE"
            viability_color = "#10B981"
            recommendation = f"Strong economic arbitrage: fly via {item['substitute_code']} to save ₹{net_savings:,.0f} net."
        elif svi_score >= 50.0:
            viability_level = "VIABLE FOR LEISURE"
            viability_color = "#FBBF24"
            recommendation = f"Favorable for non-urgent travelers: saves ₹{gross_savings:,.0f} gross (net ₹{net_savings:,.0f})."
        else:
            viability_level = "MARGINAL"
            viability_color = "#94A3B8"
            recommendation = f"Ground transit penalty ({item['transit_time_mins']} mins) offsets modest fare savings."

        substitution_cards.append({
            "pair_id": item["id"],
            "region": item["region"],
            "primary": {
                "code": item["primary_code"],
                "name": item["primary_name"],
                "avg_fare": round(primary_avg_fare, 2),
                "corridor_reference": base_route
            },
            "substitute": {
                "code": item["substitute_code"],
                "name": item["substitute_name"],
                "avg_fare": substitute_avg_fare,
                "distance_from_hub_km": item["surface_distance_km"],
                "transit_time_mins": item["transit_time_mins"],
                "transit_cost_inr": item["transit_cost_inr"],
                "best_for": item["best_for"]
            },
            "arbitrage": {
                "gross_savings_inr": gross_savings,
                "net_savings_inr": net_savings,
                "savings_pct": round((gross_savings / primary_avg_fare) * 100, 1),
                "svi_score": svi_score,
                "viability_level": viability_level,
                "viability_color": viability_color,
                "recommendation": recommendation
            }
        })

    return {
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_catchment_pairs": len(substitution_cards),
        "pairs": substitution_cards,
        "methodology": "Substitution Viability Index (SVI) = Net Financial Savings vs Ground Transit Impedance"
    }


def simulate_airport_disruption(
    hub_code: str = "DEL",
    capacity_cut_pct: float = 25.0,
    weather_severity_pct: float = 50.0,
    demand_surge_pct: float = 20.0,
    db=None
) -> Dict[str, Any]:
    """
    Simulates operational shocks and capacity disruption on a major airport hub.
    Projects simulated fare impact, shocked Route Stress Index (RSI), and optimal
    rerouting/substitution strategies.
    """
    if db is None:
        db = get_mongo_db()

    hub_code = str(hub_code).upper().strip()
    capacity_cut_pct = max(0.0, min(80.0, float(capacity_cut_pct)))
    weather_severity_pct = max(0.0, min(100.0, float(weather_severity_pct)))
    demand_surge_pct = max(0.0, min(100.0, float(demand_surge_pct)))

    # Fetch baseline RSI
    rsi_data = compute_route_stress_index(db)
    national_baseline_rsi = rsi_data["national_composite"]["rsi"]

    # Identify corridors touching this hub
    affected_corridors = [
        c for c in rsi_data["corridors"]
        if hub_code in (c["origin_code"], c["destination_code"])
    ]

    if not affected_corridors:
        # Fallback to DEL if hub not in direct routes
        affected_corridors = [
            c for c in rsi_data["corridors"]
            if "DEL" in (c["origin_code"], c["destination_code"])
        ]
        hub_code = "DEL"

    # Calculate shock multiplier
    # Supply contraction elasticity: ~1.2x; Demand surge elasticity: ~0.8x; Weather friction: ~0.5x
    shock_fare_multiplier = 1.0 + (capacity_cut_pct * 0.012) + (demand_surge_pct * 0.008) + (weather_severity_pct * 0.005)
    projected_fare_impact_pct = round((shock_fare_multiplier - 1.0) * 100.0, 1)

    # Shocked RSI formula
    # Capacity cut directly drives availability drop; Demand surge drives demand proxy; Weather drives volatility
    simulated_corridors = []
    for c in affected_corridors:
        orig_rsi = c["rsi"]
        f = c["factors"]

        shocked_fare_factor = min(100.0, f["fare_anomaly"]["score"] + (projected_fare_impact_pct * 0.7))
        shocked_avail_factor = min(100.0, f["availability_drop"]["score"] + (capacity_cut_pct * 1.1))
        shocked_vol_factor = min(100.0, f["volatility"]["score"] + (weather_severity_pct * 0.6))
        shocked_dem_factor = min(100.0, f["demand_proxy"]["score"] + (demand_surge_pct * 0.7))
        shocked_agree_factor = min(100.0, f["cross_source_agreement"]["score"] + 10.0)

        shocked_rsi = (
            0.30 * shocked_fare_factor +
            0.20 * shocked_avail_factor +
            0.20 * shocked_vol_factor +
            0.15 * shocked_dem_factor +
            0.15 * shocked_agree_factor
        )
        shocked_rsi = round(min(100.0, max(orig_rsi, shocked_rsi)), 1)

        sim_level = (
            "CRITICAL" if shocked_rsi >= 75.0 else
            "HIGH" if shocked_rsi >= 60.0 else
            "MODERATE" if shocked_rsi >= 40.0 else "NOMINAL"
        )

        simulated_corridors.append({
            "route_code": c["route_code"],
            "route_name": c["route_name"],
            "baseline_rsi": orig_rsi,
            "shocked_rsi": shocked_rsi,
            "rsi_delta": round(shocked_rsi - orig_rsi, 1),
            "baseline_fare": c["avg_fare"],
            "projected_fare": round(c["avg_fare"] * shock_fare_multiplier, 2),
            "level": sim_level,
            "color": "#EF4444" if sim_level == "CRITICAL" else "#F97316" if sim_level == "HIGH" else "#FBBF24"
        })

    # Find substitute airport for this hub
    sub_pair = next(
        (p for p in AIRPORT_SUBSTITUTION_REGISTRY if p["primary_code"] == hub_code),
        AIRPORT_SUBSTITUTION_REGISTRY[0]
    )

    avg_shocked_rsi = round(sum(sc["shocked_rsi"] for sc in simulated_corridors) / len(simulated_corridors), 1)

    # Displaced passengers estimation (based on 35k daily hub volume * capacity cut)
    daily_hub_pax = 72000 if hub_code in ("DEL", "BOM") else 42000
    displaced_passengers = int(daily_hub_pax * (capacity_cut_pct / 100.0))

    return {
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "hub_code": hub_code,
        "scenario_parameters": {
            "capacity_reduction_pct": capacity_cut_pct,
            "weather_severity_pct": weather_severity_pct,
            "demand_surge_pct": demand_surge_pct,
        },
        "simulation_results": {
            "projected_fare_impact_pct": projected_fare_impact_pct,
            "baseline_avg_rsi": round(sum(sc["baseline_rsi"] for sc in simulated_corridors) / len(simulated_corridors), 1),
            "shocked_avg_rsi": avg_shocked_rsi,
            "shock_level": "CRITICAL" if avg_shocked_rsi >= 75.0 else "HIGH" if avg_shocked_rsi >= 60.0 else "MODERATE",
            "daily_displaced_passengers": displaced_passengers,
            "affected_corridors_count": len(simulated_corridors),
            "recommended_substitution": {
                "primary_hub": sub_pair["primary_code"],
                "alternate_hub": sub_pair["substitute_code"],
                "alternate_name": sub_pair["substitute_name"],
                "transit_time_mins": sub_pair["transit_time_mins"],
                "mitigation_strategy": f"Diverting traffic through {sub_pair['substitute_code']} bypasses hub congestion and prevents up to ₹{int(7500 * (shock_fare_multiplier - 1.0)):,d} in price spike premiums."
            },
            "corridor_projections": simulated_corridors
        }
    }
