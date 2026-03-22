#!/usr/bin/env node

// Postinstall script: pre-downloads the binary for the current platform

const { execFileSync } = require("child_process");
const { join } = require("path");

try {
  // Trigger the binary download by running version check
  execFileSync("node", [join(__dirname, "bin", "guardianmcp.js"), "version"], {
    stdio: "inherit",
  });
} catch (err) {
  // Non-fatal: binary will be downloaded on first use
  console.error("Note: Could not pre-download guardianmcp binary. It will be downloaded on first use.");
}
