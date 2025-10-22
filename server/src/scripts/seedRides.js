import { db } from "../utils/ridesDb.js";

const sampleRides = [
  {
    "driverEmail": "alex.miller@usu.edu",
    "school": "Utah State University",
    "from": "Utah State University",
    "destination": "Salt Lake City, Utah",
    "departureDate": "2025-10-09",
    "departureTime": "08:00",
    "seatsAvailable": 3,
    "notes": "Leaving from the main parking lot near the TSC around 8 AM. Room for 3!",
    "distance": 83.7,
    "passengers": []
  },
  {
    "driverEmail": "jordan.hughes@usu.edu",
    "school": "Utah State University",
    "from": "Utah State University",
    "destination": "Ogden, Utah",
    "departureDate": "2025-10-09",
    "departureTime": "17:30",
    "seatsAvailable": 2,
    "notes": "Heading south after evening classes, can drop off anywhere along I‑15.",
    "distance": 46.5,
    "passengers": ["rachel.hall@usu.edu"]
  }
];

// clear existing rides
db.getRides().forEach(ride => db.deleteRide(ride.id));
sampleRides.forEach((ride) => db.createRide(ride));

console.log(`✅ Seeded ${sampleRides.length} rides for Utah State University`);