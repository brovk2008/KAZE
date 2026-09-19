"""
Delhi NCR neighbourhood graph seed data.
15 neighbourhood nodes + 1 warehouse + 1 customer, with 22 ROAD edges.
Road distances are real road distances (km) from Google Maps, NOT Haversine.
AQI values are representative winter averages — overwritten by live CPCB sync.
"""

NEIGHBORHOODS = [
    {"name": "Connaught Place",   "lat": 28.6329, "lon": 77.2195, "aqi": 182, "station": "Mandir Marg, Delhi - DPCC"},
    {"name": "Anand Vihar",       "lat": 28.6469, "lon": 77.3152, "aqi": 264, "station": "Anand Vihar, Delhi - DPCC"},
    {"name": "ITO",               "lat": 28.6328, "lon": 77.2402, "aqi": 201, "station": "ITO, Delhi - DPCC"},
    {"name": "Punjabi Bagh",      "lat": 28.6681, "lon": 77.1280, "aqi": 178, "station": "Punjabi Bagh, Delhi - DPCC"},
    {"name": "Dwarka Sec 8",      "lat": 28.5823, "lon": 77.0637, "aqi": 145, "station": "Dwarka-Sector 8, Delhi - DPCC"},
    {"name": "RK Puram",          "lat": 28.5672, "lon": 77.1878, "aqi": 198, "station": "R.K. Puram, Delhi - DPCC"},
    {"name": "Mandir Marg",       "lat": 28.6430, "lon": 77.2021, "aqi": 172, "station": "Mandir Marg, Delhi - DPCC"},
    {"name": "Jahangirpuri",      "lat": 28.7300, "lon": 77.1665, "aqi": 312, "station": "Jahangirpuri, Delhi - DPCC"},
    {"name": "Okhla Phase 2",     "lat": 28.5280, "lon": 77.2736, "aqi": 231, "station": "Okhla Phase-2, Delhi - DPCC"},
    {"name": "Shadipur",          "lat": 28.6540, "lon": 77.1445, "aqi": 189, "station": "Shadipur, Delhi - DPCC"},
    {"name": "Noida Sec 62",      "lat": 28.6270, "lon": 77.3648, "aqi": 278, "station": "Sector-62, Noida - UPPCB"},
    {"name": "Gurugram Sec 51",   "lat": 28.4494, "lon": 77.0517, "aqi": 134, "station": "Sector-51, Gurugram - HSPCB"},
    {"name": "Wazirpur",          "lat": 28.6908, "lon": 77.1587, "aqi": 289, "station": "Wazirpur, Delhi - DPCC"},
    {"name": "Rohini",            "lat": 28.7293, "lon": 77.1210, "aqi": 215, "station": "Rohini, Delhi - DPCC"},
    {"name": "Nehru Nagar",       "lat": 28.5673, "lon": 77.2536, "aqi": 196, "station": "Okhla Phase-2, Delhi - DPCC"},
]

WAREHOUSE = {
    "name": "Okhla Industrial Estate",
    "lat": 28.5398,
    "lon": 77.2706,
    "aqi": 0,
}

CUSTOMER = {
    "name": "Connaught Place Delivery",
    "lat": 28.6295,
    "lon": 77.2205,
    "aqi": 0,
}

# (from, to, distance_km)
ROADS = [
    # Warehouse → network
    ("Okhla Industrial Estate", "Nehru Nagar",      2.1),
    ("Okhla Industrial Estate", "Okhla Phase 2",    1.8),
    # Southern belt
    ("Nehru Nagar",      "RK Puram",                4.2),
    ("Okhla Phase 2",    "Nehru Nagar",             2.3),
    ("RK Puram",         "Dwarka Sec 8",            12.4),
    ("RK Puram",         "Mandir Marg",             5.1),
    ("Gurugram Sec 51",  "Dwarka Sec 8",            14.8),
    ("Dwarka Sec 8",     "Punjabi Bagh",            18.2),
    # Central corridor
    ("Mandir Marg",      "Connaught Place",          2.6),
    ("Connaught Place",  "ITO",                      3.8),
    ("ITO",              "Anand Vihar",             11.2),
    ("Anand Vihar",      "Noida Sec 62",             7.4),
    # North belt
    ("Connaught Place",  "Shadipur",                 8.1),
    ("Shadipur",         "Punjabi Bagh",             5.3),
    ("Punjabi Bagh",     "Wazirpur",                 7.4),
    ("Wazirpur",         "Jahangirpuri",             6.2),
    ("Jahangirpuri",     "Rohini",                   6.8),
    # Cross links
    ("ITO",              "Mandir Marg",              3.1),
    ("Shadipur",         "Wazirpur",                 5.9),
    ("Nehru Nagar",      "Okhla Phase 2",            2.3),
    ("RK Puram",         "Connaught Place",          7.2),
    # Customer
    ("Connaught Place",  "Connaught Place Delivery", 0.5),
    ("Mandir Marg",      "Connaught Place Delivery", 2.8),
]


def aqi_to_category(aqi: int) -> tuple[str, str]:
    if aqi <= 50:   return "Good", "#00B050"
    if aqi <= 100:  return "Satisfactory", "#92D050"
    if aqi <= 200:  return "Moderate", "#FFFF00"
    if aqi <= 300:  return "Poor", "#FF9900"
    if aqi <= 400:  return "Very Poor", "#FF0000"
    return "Severe", "#800000"
