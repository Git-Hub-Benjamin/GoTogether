const fs = require("fs");
const path = require("path");

// JSON input/output file paths
const inputPath = path.resolve("C:\\VSCode\\go-together\\server\\src\\data\\us_universities.json");
const outputPath = path.resolve("C:\\VSCode\\go-together\\server\\src\\data\\us_universities_with_states.json");

// List of all U.S. state names to match against
const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

function main() {
  const rawData = fs.readFileSync(inputPath, "utf-8");
  const universities = JSON.parse(rawData);

  const updated = universities.map((university) => {
    let state = university["state-province"];
    const name = university.name;

    if (state === null) {
      const foundState = US_STATES.find((s) =>
        new RegExp(`\\b${s}\\b`, "i").test(name)
      );
      if (foundState) {
        state = foundState;
      }
    }

    return {
      ...university,
      ["state-province"]: state,
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(updated, null, 2), "utf-8");
  console.log(`✅ Updated universities written to: ${outputPath}`);
}

main();