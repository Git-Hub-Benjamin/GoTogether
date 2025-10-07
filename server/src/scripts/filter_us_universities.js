const fs = require("fs");

const all = JSON.parse(
  fs.readFileSync("world_universities_and_domains.json", "utf8")
);
const usOnly = all.filter((u) => u.alpha_two_code === "US");

fs.writeFileSync(
  "C:\\VSCode\\go-together\\server\\src\\data\\us_universities.json",
  JSON.stringify(usOnly, null, 2)
);

console.log(`✅ Saved ${usOnly.length} US universities.`);