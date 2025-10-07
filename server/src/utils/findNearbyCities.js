const fs = require("fs");
const path = require("path");

// Load city data once at startup
const CITIES_PATH = path.resolve(
  "C:\\VSCode\\go-together\\server\\src\\data\\us_cities.json"
);
const cities = JSON.parse(fs.readFileSync(CITIES_PATH, "utf-8"));

/** Compute great-circle distance in KM (Haversine formula) */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km radius
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearby cities around a given lat/lng
 * - Default distance: 100 miles
 * - Default threshold: 50,000 population
 * - Falls back to any cities within radius if none big enough
 */
function findNearbyCitiesDynamic(
  lat,
  lng,
  distanceMiles = 100,
  populationThreshold = 50000,
  limit = 10
) {
  const radiusKm = distanceMiles * 1.60934;

  // Step 1: cities with population >= threshold
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
      distance_km: Math.round(haversine(lat, lng, c.lat, c.lng) * 10) / 10,
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);

  // Step 2: fallback if none found
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

module.exports = { findNearbyCitiesDynamic };