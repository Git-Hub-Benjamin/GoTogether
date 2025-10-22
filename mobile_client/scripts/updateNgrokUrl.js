/* global __dirname */
const fs = require("fs");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

// Get the API file path - resolve relative to scripts directory
const API_FILE = path.resolve(__dirname, "../utils/api.js");
const PORT = 5000;
const NGROK_API_URL = "http://127.0.0.1:4040/api/tunnels";

async function fetchNgrokUrl() {
  return new Promise((resolve, reject) => {
    http.get(NGROK_API_URL, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const tunnels = JSON.parse(data).tunnels;
          const httpsTunnel = tunnels.find((t) => t.proto === "https");
          if (httpsTunnel) {
            resolve(httpsTunnel.public_url);
          } else {
            reject(new Error("No HTTPS tunnel found"));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });
}

async function waitForNgrokReady(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetchNgrokUrl();
      return true;
    } catch (err) {
      if (i < maxRetries - 1) {
        console.log(`Waiting for ngrok... (attempt ${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  throw new Error("Ngrok API did not respond after maximum retries");
}

async function updateNgrokUrl() {
  try {
    console.log("Starting ngrok tunnel...");

    // Start ngrok process
    const ngrokProcess = spawn("ngrok", ["http", PORT.toString()], {
      stdio: "ignore",
      detached: true,
    });

    // Detach the process so it runs independently
    ngrokProcess.unref();

    // Wait for ngrok to be ready before fetching URL
    await waitForNgrokReady();

    // Fetch the public URL from ngrok's local API
    const url = await fetchNgrokUrl();
    console.log("🌐 New ngrok URL:", url);

    // Ensure the file exists
    if (!fs.existsSync(API_FILE)) {
      console.error("❌ API file not found at:", API_FILE);
      return;
    }

    let fileContent = fs.readFileSync(API_FILE, "utf8");

    // Regex to find and replace the API_BASE line
    const apiBaseRegex =
      /export const API_BASE = process\.env\.SHARED_API_BASE \|\| `.*?\/api`;/;

    const replacement = `export const API_BASE = process.env.SHARED_API_BASE || \`${url}/api\`;`;

    if (apiBaseRegex.test(fileContent)) {
      fileContent = fileContent.replace(apiBaseRegex, replacement);
      fs.writeFileSync(API_FILE, fileContent, "utf8");
      console.log("✅ Updated API_BASE URL in", API_FILE);
    } else {
      console.warn("⚠️ Could not find API_BASE line in", API_FILE);
    }

    console.log("Public Tunnel:", `${url}/api`);
    console.log("✨ Tunnel is live. Use this URL in your frontend or mobile app.");
    console.log("Closing NgrokUpdater terminal in 10 seconds...");
    
    // Wait 10 seconds before closing
    setTimeout(() => {
      process.exit(0);
    }, 10000);
  } catch (err) {
    console.error("❌ Error updating ngrok URL:", err.message);
    console.log("Closing NgrokUpdater terminal in 10 seconds...");
    
    // Wait 10 seconds before closing even on error
    setTimeout(() => {
      process.exit(1);
    }, 10000);
  }
}

updateNgrokUrl();