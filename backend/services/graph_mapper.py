"""
CPCB station name → neighbourhood node name mapping.
The data.gov.in API returns station names like "Anand Vihar, Delhi - DPCC"
but our graph nodes use short canonical names like "Anand Vihar".
"""

STATION_TO_NEIGHBORHOOD: dict[str, str] = {
    "Anand Vihar, Delhi - DPCC":          "Anand Vihar",
    "ITO, Delhi - DPCC":                  "ITO",
    "Punjabi Bagh, Delhi - DPCC":         "Punjabi Bagh",
    "Dwarka-Sector 8, Delhi - DPCC":      "Dwarka Sec 8",
    "R.K. Puram, Delhi - DPCC":           "RK Puram",
    "Mandir Marg, Delhi - DPCC":          "Mandir Marg",
    "Jahangirpuri, Delhi - DPCC":         "Jahangirpuri",
    "Okhla Phase-2, Delhi - DPCC":        "Okhla Phase 2",
    "Shadipur, Delhi - DPCC":             "Shadipur",
    "Wazirpur, Delhi - DPCC":             "Wazirpur",
    "Rohini, Delhi - DPCC":               "Rohini",
    "Sector-62, Noida - UPPCB":           "Noida Sec 62",
    "Sector-51, Gurugram - HSPCB":        "Gurugram Sec 51",
    # Fallback aliases
    "Mandir Marg":                        "Connaught Place",
}


def station_to_neighborhood(station_name: str) -> str | None:
    """Return the graph node name for a CPCB station, or None if unmapped."""
    return STATION_TO_NEIGHBORHOOD.get(station_name)
