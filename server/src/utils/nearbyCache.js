const fs = require("fs");
const path = require("path");
const { findNearbyCities } = require("./findNearbyCities");

const CACHE_PATH = path.resolve("C:\\VSCode\\go-together\\server\\src\\data\\nearby_cache.json");

// Load cache once when the module is imported
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch (err) {
    console.warn("⚠️ Couldn't read nearby_cache.json, starting fresh");
    cache = {};
  }
}

/**
 * Get nearby cities for a campus
 * - Checks cache first
 * - If missing, computes and stores persistently
 */
function getNearbyCitiesForUniversity(name, lat, lon) {
  const key = name.toLowerCase();

  if (cache[key]) {
    return cache[key]; // cached copy
  }

  const computed = findNearbyCities(lat, lon);
  cache[key] = computed;

  // Persist to disk immediately (so all future calls are instant)
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  console.log(`🗺️ Cached nearby cities for: ${name}`);

  return computed;
}

/**
 * Optional helper to preload cache for all universities (bulk mode)
 */
function preloadAllUniversities(universities) {
  universities.forEach((u) => {
    if (u.lat && u.lon) {
      getNearbyCitiesForUniversity(u.name, u.lat, u.lon);
    }
  });
}

module.exports = {
  getNearbyCitiesForUniversity,
  preloadAllUniversities,
};