import json
from pathlib import Path

# ---------- Configuration ----------
INPUT_FILE = Path("us_universities.json")   # your original JSON file
OUTPUT_FILE = Path("us_universities_short.json")    # the cleaned output file

# ---------- Function to simplify data ----------
def simplify_school_entry(entry: dict) -> dict:
    """
    Keep only name, state, and colors from each school entry.
    If colors are missing, provide a default fallback.
    """
    return {
        "name": entry.get("name", "").strip(),
        "state": entry.get("state") or entry.get("state-province") or "",
        "colors": entry.get("colors", ["#00263A", "#335a6d"]),
    }


def main():
    # Load the full dataset
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Input JSON must be an array of school objects.")

    simplified = [simplify_school_entry(item) for item in data]

    # Write simplified data
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(simplified, f, indent=2, ensure_ascii=False)

    print(f"✅ Simplified {len(simplified)} entries → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()