const fs = require("fs");
const path = require("path");

// Input / output paths
const inputPath = path.resolve("C:\\VSCode\\go-together\\server\\src\\data\\uscities.csv");
const outputPath = path.resolve("C:\\VSCode\\go-together\\server\\src\\data\\us_cities.json");

// Read file
const csvContent = fs.readFileSync(inputPath, "utf-8");

// Split into lines (remove empty lines)
const lines = csvContent
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

// Extract header and data rows
const header = lines.shift();
if (!header) {
  console.error("❌ No header found in CSV file!");
  process.exit(1);
}

// Split header columns
const columns = header
  .replace(/^"|"$/g, "")
  .split(/","/)
  .map((c) => c.trim());

// Get index positions for relevant columns
const colIndex = {
  city: columns.indexOf("city"),
  state_name: columns.indexOf("state_name"),
  lat: columns.indexOf("lat"),
  lng: columns.indexOf("lng"),
  population: columns.indexOf("population"),
};

for (const key in colIndex) {
  if (colIndex[key] === -1) {
    console.error(`❌ Missing expected column: ${key}`);
    process.exit(1);
  }
}

const cities = [];

for (const line of lines) {
  // Skip header again or malformed lines
  if (!line || line.startsWith('"city"')) continue;

  const parts = line
    .replace(/^"|"$/g, "")
    .split(/","/)
    .map((v) => v.trim());

  try {
    const cityObj = {
      city: parts[colIndex.city],
      state_name: parts[colIndex.state_name],
      lat: parseFloat(parts[colIndex.lat]),
      lng: parseFloat(parts[colIndex.lng]),
      population: parseInt(parts[colIndex.population], 10),
    };

    // Only keep valid entries
    if (
      cityObj.city &&
      cityObj.state_name &&
      !isNaN(cityObj.lat) &&
      !isNaN(cityObj.lng)
    ) {
      cities.push(cityObj);
    }
  } catch (err) {
    console.warn("⚠️ Could not parse line:", line);
  }
}

fs.writeFileSync(outputPath, JSON.stringify(cities, null, 2), "utf-8");

console.log(`✅ Converted ${cities.length.toLocaleString()} cities`);
console.log(`📁 Saved to ${outputPath}`);