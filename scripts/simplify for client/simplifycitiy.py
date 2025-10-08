import json
import os # Import the os module for path manipulation

def extract_city_state_to_json(input_json_file_path, output_json_file_path):
    """
    Reads a JSON file containing city data, extracts only the city and state name,
    and saves this data to a new JSON file.

    Args:
        input_json_file_path (str): The path to the input JSON file.
        output_json_file_path (str): The path where the new JSON file will be saved.
    """
    try:
        with open(input_json_file_path, 'r', encoding='utf-8') as infile:
            cities_data = json.load(infile)

        if not isinstance(cities_data, list):
            print("Error: The input JSON file does not contain a list of city objects.")
            return

        extracted_data = []
        for city_data in cities_data:
            city = city_data.get("city")
            state = city_data.get("state_name")

            if city and state:
                extracted_data.append({"city": city, "state_name": state})
            else:
                print(f"Warning: Skipping entry due to missing 'city' or 'state_name' key: {city_data}")

        # Ensure the output directory exists
        output_dir = os.path.dirname(output_json_file_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"Created directory: {output_dir}")

        with open(output_json_file_path, 'w', encoding='utf-8') as outfile:
            json.dump(extracted_data, outfile, indent=2) # Use indent=2 for pretty printing

        print(f"Successfully extracted city and state names to '{output_json_file_path}'")

    except FileNotFoundError:
        print(f"Error: The input file '{input_json_file_path}' was not found.")
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{input_json_file_path}'. Please check the file format.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    # Define your input and output file paths
    input_file = "C:\\VSCode\\go-together\\scripts\\simplify for client\\us_cities.json"  # Make sure this path is correct
    output_file = "C:\\VSCode\\go-together\\scripts\\simplify for client\\us_cities_sim.json" # New file will be created here

    # Create a dummy input file for testing if it doesn't exist
    if not os.path.exists(input_file):
        print(f"Creating a dummy input file at '{input_file}' for demonstration.")
        os.makedirs(os.path.dirname(input_file) or '.', exist_ok=True) # Ensure directory exists
        dummy_data = [
          {
            "city": "New York",
            "state_name": "New York",
            "lat": 40.6943,
            "lng": -73.9249,
            "population": 18832416
          },
          {
            "city": "Los Angeles",
            "state_name": "California",
            "lat": 34.1141,
            "lng": -118.4068,
            "population": 11885717
          },
          {
            "city": "Chicago",
            "state_name": "Illinois",
            "lat": 41.8375,
            "lng": -87.6866,
            "population": 8489066
          },
          {
            "city": "Houston",
            "state_name": "Texas",
            "lat": 29.7863,
            "lng": -95.3888,
            "population": 5994065
          },
          {
            "city": None, # Example of missing data
            "state_name": "Arizona",
            "lat": 33.4567,
            "lng": -112.0123,
            "population": 1000000
          }
        ]
        with open(input_file, "w", encoding="utf-8") as f:
            json.dump(dummy_data, f, indent=2)

    extract_city_state_to_json(input_file, output_file)