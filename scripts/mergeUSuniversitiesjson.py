import json

def normalize_name(name):
    """Normalize university names for comparison."""
    return name.strip().lower()

def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def write_json(file_path, data):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def merge_university_data(wo_path, w_path):
    # Load both datasets
    wo_data = load_json(wo_path)
    w_data = load_json(w_path)

    # Create lookup dict for 'w' data (with domain)
    w_lookup = {normalize_name(item["name"]): item for item in w_data}

    matched = []
    not_found_wo = []
    found_names = set()

    # Match entries by name
    for uni in wo_data:
        norm_name = normalize_name(uni["name"])
        if norm_name in w_lookup:
            w_entry = w_lookup[norm_name]
            domains = w_entry.get("domains", [])
            matched.append({
                "name": uni["name"],
                "state-province": uni.get("state-province"),
                "lat": uni.get("lat"),
                "lng": uni.get("lng"),
                "population": uni.get("population"),
                "domains": domains
            })
            found_names.add(norm_name)
        else:
            not_found_wo.append(uni)

    # Find items in w.json not matched
    not_found_w = [
        uni for uni in w_data
        if normalize_name(uni["name"]) not in found_names
    ]

    # Write results
    write_json("us_universities_matched.json", matched)
    write_json("not_found_us_universities_wo.json", not_found_wo)
    write_json("not_found_us_universities_w.json", not_found_w)

    print(f"✅ Created 'us_universities_matched.json' ({len(matched)} matched)")
    print(f"⚠️  Created 'not_found_us_universities_wo.json' ({len(not_found_wo)} from WO not matched)")
    print(f"⚠️  Created 'not_found_us_universities_w.json' ({len(not_found_w)} from W not matched)")

if __name__ == "__main__":
    merge_university_data("us_universities_wo.json", "us_universities_w.json")