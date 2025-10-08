import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CITIES_PATH = path.join(__dirname, "../data/us_cities.json");

let cities = [];
try {
  cities = JSON.parse(fs.readFileSync(CITIES_PATH, "utf-8"));
} catch (err) {
  console.error("Error loading cities data:", err);
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Calculates the distance between two geographical points in miles using the Haversine formula.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} The distance in miles.
 */
export function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const distanceKm = haversine(lat1, lon1, lat2, lon2);
  const milesPerKm = 0.621371;
  return distanceKm * milesPerKm;
}

export function findNearbyCitiesDynamic(
  lat,
  lng,
  distanceMiles = 100,
  populationThreshold = 50000,
  limit = 10
) {
  const radiusKm = distanceMiles * 1.60934; // Convert miles to kilometers

  let nearby = cities
    .filter(
      (c) =>
        c.population >= populationThreshold &&
        haversine(lat, lng, c.lat, c.lng) <= radiusKm
    )
    .map((c) => ({
      city: c.city,
      state: c.state_name,
      population: c.population,
      distance_km:
        Math.round(haversine(lat, lng, c.lat, c.lng) * 10) / 10,
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);

  if (nearby.length === 0) {
    nearby = cities
      .filter((c) => haversine(lat, lng, c.lat, c.lng) <= radiusKm)
      .map((c) => ({
        city: c.city,
        state: c.state_name,
        population: c.population,
        distance_km:
          Math.round(haversine(lat, lng, c.lat, c.lng) * 10) / 10,
      }))
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);
  }

  return nearby;
}