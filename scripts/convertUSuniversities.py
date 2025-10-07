import csv
import json

# Mapping of US state abbreviations to full names
STATE_ABBREVIATIONS = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming",
    "DC": "District of Columbia"
}

def clean_title(name: str) -> str:
    """Converts a name to Title Case (handles acronyms & edge cases)."""
    return " ".join(word.capitalize() for word in name.split())

def parse_csv_to_json(csv_file: str, json_file: str) -> None:
    universities = []

    with open(csv_file, newline='', encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile, delimiter=';')

        for row in reader:
            name = clean_title(row["NAME"].strip())
            state_abbr = row["STATE"].strip().upper()
            state_full = STATE_ABBREVIATIONS.get(state_abbr, state_abbr)
            
            try:
                lat = float(row["LATITUDE"])
                lng = float(row["LONGITUDE"])
            except ValueError:
                continue  # Skip invalid entries

            try:
                population = int(row["POPULATION"])
            except ValueError:
                population = None

            university = {
                "name": name,
                "state-province": state_full,
                "lat": lat,
                "lng": lng,
                "population": population
            }

            universities.append(university)

    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(universities, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    parse_csv_to_json("us-colleges-and-universities.csv", "us_universities.json")
    print("✅ us_universities.json has been created successfully.")