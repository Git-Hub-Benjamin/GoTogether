const fs = require("fs");
const path = require("path");
const { findNearbyCitiesDynamic } = require("../utils/findNearbyCities.js");

const UNIVERSITIES_PATH = path.resolve(
  "C:\\VSCode\\go-together\\server\\src\\data\\us_universities.json"
);
const CACHE_PATH = path.resolve(
  "C:\\VSCode\\go-together\\server\\src\\data\\nearby_cache.json"
);

function main() {
  console.log("⏳ Preloading nearby city cache for universities...");

  const universities = JSON.parse(fs.readFileSync(UNIVERSITIES_PATH, "utf-8"));
  let cache = {};

  if (fs.existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch {
      console.warn("⚠️ Couldn't read existing nearby_cache.json, starting fresh.");
      cache = {};
    }
  }

  let processed = 0;

  for (const uni of universities) {
    const name = uni.name;
    if (!uni.lat || !uni.lng) continue;

    if (!cache[name]) {
      const nearby = findNearbyCitiesDynamic(uni.lat, uni.lng, 100);
      cache[name] = nearby;
      console.log(`🗺️ Added nearby cities for: ${name}`);
      processed++;
    }
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  console.log(`✅ Cached ${processed} universities.`);
  console.log(`📁 Saved to ${CACHE_PATH}`);
}

main();