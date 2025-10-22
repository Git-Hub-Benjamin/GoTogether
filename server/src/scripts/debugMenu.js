import fetch from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

const BASE_URL = "http://localhost:5000";
let authToken = null;

// ANSI color codes for better readability
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  if (authToken) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${authToken}`,
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    return await response.json();
  } catch (error) {
    console.error(
      `${colors.red}Error making request to ${endpoint}:${colors.reset}`,
      error
    );
    return null;
  }
}

async function getDebugToken() {
  if (!authToken) {
    const result = await makeRequest("/debug/token");
    if (result?.token) {
      authToken = result.token;
      console.log(`${colors.green}✓ Debug token acquired${colors.reset}`);
    }
  }
  return authToken;
}

async function serverStatus() {
  console.log(`\n${colors.bright}🔍 Checking server status...${colors.reset}`);
  await getDebugToken();
  const status = await makeRequest("/debug/status");

  if (status) {
    console.log(`${colors.green}✓ Server is running${colors.reset}`);
    console.log("\nServer Information:");
    console.log(
      `${colors.cyan}Uptime:${colors.reset} ${Math.floor(
        status.uptime / 60
      )} minutes`
    );
    console.log(
      `${colors.cyan}Environment:${colors.reset} ${status.environment}`
    );
    console.log(`${colors.cyan}Memory Usage:${colors.reset}`);
    Object.entries(status.memory).forEach(([key, value]) => {
      console.log(`  - ${key}: ${Math.round(value / 1024 / 1024)}MB`);
    });
  }
}

async function getRides() {
  console.log(
    `\n${colors.bright}🚗 Fetching rides information...${colors.reset}`
  );
  await getDebugToken();
  const data = await makeRequest("/debug/rides");

  if (data) {
    // System Information
    console.log(`\n${colors.bright}🖥️  System Information${colors.reset}`);
    console.log(`${colors.cyan}Timestamp:${colors.reset} ${data.timestamp}`);
    console.log(`${colors.cyan}Node Version:${colors.reset} ${data.debugInfo.nodeVersion}`);
    console.log(`${colors.cyan}Platform:${colors.reset} ${data.debugInfo.platform}`);
    console.log(`${colors.cyan}Memory Usage:${colors.reset}`);
    Object.entries(data.debugInfo.memoryUsage).forEach(([key, value]) => {
      console.log(`  - ${key}: ${(value / 1024 / 1024).toFixed(2)} MB`);
    });

    // Overall Statistics
    console.log(`\n${colors.bright}📊 Overall Statistics${colors.reset}`);
    console.log(`${colors.cyan}Total Rides:${colors.reset} ${data.stats.total}`);
    console.log(`${colors.cyan}Active Rides:${colors.reset} ${data.stats.activeRides}`);
    console.log(`${colors.cyan}Past Rides:${colors.reset} ${data.stats.pastRides}`);
    console.log(`${colors.cyan}Total Passengers:${colors.reset} ${data.stats.totalPassengers}`);
    console.log(`${colors.cyan}Total Pending Requests:${colors.reset} ${data.stats.totalPendingRequests}`);
    console.log(`${colors.cyan}Seats Statistics:${colors.reset}`);
    console.log(`  - Available: ${data.stats.totalSeatsAvailable}`);
    console.log(`  - Used: ${data.stats.totalSeatsUsed}`);
    console.log(`  - Average per ride: ${data.stats.averageSeatsPerRide}`);

    // Request Statistics
    console.log(`\n${colors.bright}📫 Request Statistics${colors.reset}`);
    console.log(`${colors.cyan}Rides with Requests:${colors.reset} ${data.stats.requestStats.ridesWithRequests}`);
    console.log(`${colors.cyan}Total Requests:${colors.reset} ${data.stats.requestStats.totalRequests}`);

    // Monthly Distribution
    console.log(`\n${colors.bright}📅 Monthly Distribution${colors.reset}`);
    Object.entries(data.stats.byMonth).forEach(([month, count]) => {
      console.log(`${colors.cyan}${month}:${colors.reset} ${count} rides`);
    });

    // School Statistics
    console.log(`\n${colors.bright}🏫 School Statistics${colors.reset}`);
    Object.entries(data.stats.bySchool).forEach(([school, stats]) => {
      console.log(`\n${colors.yellow}${school}${colors.reset}`);
      console.log(`  Total Rides: ${stats.total} (${stats.active} active)`);
      console.log(`  Passengers: ${stats.passengers}`);
      console.log(`  Pending Requests: ${stats.pendingRequests}`);
      console.log(`  Average Seats: ${stats.averageSeats}`);
    });

    // Detailed Ride List
    if (data.rides && data.rides.length > 0) {
      console.log(`\n${colors.bright}📝 Detailed Ride List${colors.reset}`);
      data.rides.forEach((ride, index) => {
        console.log(`\n${colors.yellow}Ride #${index + 1} (ID: ${ride.id})${colors.reset}`);
        console.log(`${colors.cyan}Status:${colors.reset} ${ride.debug.status.toUpperCase()}`);
        console.log(`${colors.cyan}Route:${colors.reset} ${ride.from} → ${ride.destination}`);
        console.log(`${colors.cyan}When:${colors.reset} ${ride.departureDate} at ${ride.departureTime}`);
        if (ride.debug.timeUntilDeparture !== null) {
          console.log(`${colors.cyan}Time until departure:${colors.reset} ${ride.debug.timeUntilDeparture} days`);
        }
        console.log(`${colors.cyan}School:${colors.reset} ${ride.school}`);
        console.log(`${colors.cyan}Driver:${colors.reset} ${ride.driverEmail}`);
        
        // Seat Information
        console.log(`${colors.cyan}Seats:${colors.reset} ${ride.seatsAvailable} total`);
        console.log(`${colors.cyan}Occupancy:${colors.reset} ${ride.debug.occupancyRate} (${ride.debug.remainingSeats} seats remaining)`);
        console.log(`${colors.cyan}Request Rate:${colors.reset} ${ride.debug.requestRate}`);
        
        // Passenger Details
        if (ride.debug.passengerDetails.length > 0) {
          console.log(`${colors.cyan}Passengers:${colors.reset}`);
          ride.debug.passengerDetails.forEach(p => {
            console.log(`  - ${p.email} (joined: ${p.joinTime})`);
          });
        }
        
        // Request Details
        if (ride.debug.requestDetails.length > 0) {
          console.log(`${colors.cyan}Pending Requests:${colors.reset}`);
          ride.debug.requestDetails.forEach(r => {
            console.log(`  - ${r.email} (requested: ${r.requestTime})`);
          });
        }
        
        if (ride.notes) {
          console.log(`${colors.cyan}Notes:${colors.reset} ${ride.notes}`);
        }
        console.log('═'.repeat(50));
      });
      console.log(`\n${colors.bright}Total:${colors.reset} ${data.rides.length} rides displayed`);
    } else {
      console.log(`\n${colors.yellow}No rides found in the system${colors.reset}`);
    }
  }
}

async function getUserActivity() {
  console.log(`\n${colors.bright}👥 Fetching user activity...${colors.reset}`);
  await getDebugToken();
  const data = await makeRequest("/debug/users");

  if (data) {
    console.log(
      `\n${colors.cyan}Total Users:${colors.reset} ${data.totalUsers}`
    );

    console.log("\nUser Activity Summary:");
    data.users.forEach((user) => {
      console.log(`\n${colors.yellow}${user.email}${colors.reset}`);
      console.log(`Rides as Driver: ${user.ridesAsDriver}`);
      console.log(`Rides as Passenger: ${user.ridesAsPassenger}`);
      console.log(`Pending Requests: ${user.pendingRequests}`);
    });
  }
}

async function getSystemEvents() {
  console.log(`\n${colors.bright}📊 Fetching system events...${colors.reset}`);
  await getDebugToken();
  const events = await makeRequest("/debug/events");

  if (events) {
    console.log("\nRate Limits:");
    Object.entries(events.rateLimits).forEach(([key, value]) => {
      console.log(`${colors.cyan}${key}:${colors.reset} ${value}`);
    });

    console.log("\nCooldowns:");
    Object.entries(events.cooldowns).forEach(([key, value]) => {
      console.log(`${colors.cyan}${key}:${colors.reset} ${value}`);
    });
  }
}

async function clearLimiters() {
  console.log(`\n${colors.bright}🔄 Clearing rate limiters...${colors.reset}`);
  await getDebugToken();
  const result = await makeRequest("/debug/clear-limiters", { method: "POST" });
  if (result?.message) {
    console.log(`${colors.green}✓ ${result.message}${colors.reset}`);
  }
}

async function showMenu() {
  console.clear();
  console.log(`
${colors.bright}Go-Together Debug Menu${colors.reset}

${colors.cyan}Debug Token:${colors.reset} ${
    authToken
      ? `${colors.green}Active${colors.reset}`
      : `${colors.yellow}Not Active${colors.reset}`
  }

${colors.bright}Available Options:${colors.reset}
1. Server Status & Information
2. Ride Statistics & Details
3. User Activity Summary
4. System Events & Rate Limits
5. Clear Rate Limiters
0. Exit
`);
  console.log(`${colors.bright}Choose an option:${colors.reset}`);
}

async function processChoice(choice) {
  console.clear();
  switch (choice) {
    case "1":
      await serverStatus();
      break;

    case "2":
      await getRides();
      break;

    case "3":
      await getUserActivity();
      break;

    case "4":
      await getSystemEvents();
      break;

    case "5":
      await clearLimiters();
      break;

    case "0":
      console.log(`${colors.bright}👋 Goodbye!${colors.reset}`);
      return false;

    default:
      console.log(
        `${colors.red}Invalid option. Please try again.${colors.reset}`
      );
  }
  return true;
}

async function getUserInput(prompt = '') {
  const readline = (await import('readline')).default;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question(prompt, resolve);
  });
  rl.close();
  return answer;
}

async function main() {
  console.log(
    `${colors.bright}🔄 Initializing debug session...${colors.reset}`
  );

  // Check if we're in development mode
  if (process.env.NODE_ENV !== 'development') {
    console.log(`${colors.red}Error: Debug menu can only be run in development mode.${colors.reset}`);
    console.log(`Please set NODE_ENV=development before running this script.`);
    process.exit(1);
  }

  await getDebugToken();

  let running = true;
  while (running) {
    await showMenu();
    const choice = await getUserInput();
    running = await processChoice(choice);
    if (running) {
      await getUserInput('\nPress Enter to return to menu...');
    }
  }
  process.exit(0);
}

main().catch(console.error);
