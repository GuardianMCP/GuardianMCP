#!/usr/bin/env node

const { execFileSync } = require("child_process");
const { existsSync, chmodSync, createWriteStream } = require("fs");
const { join } = require("path");
const https = require("https");
const http = require("http");

const VERSION = "0.1.3";
const REPO = "GuardianMCP/GuardianMCP";

const PLATFORM_MAP = {
  darwin: "darwin",
  linux: "linux",
  win32: "windows",
};

const ARCH_MAP = {
  x64: "amd64",
  arm64: "arm64",
};

function getBinaryName() {
  const platform = PLATFORM_MAP[process.platform];
  const arch = ARCH_MAP[process.arch];

  if (!platform || !arch) {
    console.error(
      `Unsupported platform: ${process.platform}/${process.arch}`
    );
    process.exit(1);
  }

  const ext = process.platform === "win32" ? ".exe" : "";
  return `guardianmcp-${platform}-${arch}${ext}`;
}

function getBinaryPath() {
  return join(__dirname, getBinaryName());
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const file = createWriteStream(dest);

    client
      .get(url, { headers: { "User-Agent": "guardianmcp-npm" } }, (response) => {
        // Handle redirects
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          file.close();
          downloadFile(response.headers.location, dest)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          reject(
            new Error(`Download failed with status ${response.statusCode}`)
          );
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        file.close();
        reject(err);
      });
  });
}

async function ensureBinary() {
  const binaryPath = getBinaryPath();

  if (existsSync(binaryPath)) {
    return binaryPath;
  }

  const binaryName = getBinaryName();
  const url = `https://github.com/${REPO}/releases/download/v${VERSION}/${binaryName}`;

  console.error(`Downloading guardianmcp v${VERSION}...`);

  try {
    await downloadFile(url, binaryPath);
    chmodSync(binaryPath, 0o755);
    console.error("Download complete.");
  } catch (err) {
    console.error(`Failed to download guardianmcp binary: ${err.message}`);
    console.error(
      `You can manually download from: https://github.com/${REPO}/releases`
    );
    process.exit(1);
  }

  return binaryPath;
}

async function main() {
  const binaryPath = await ensureBinary();

  try {
    execFileSync(binaryPath, process.argv.slice(2), {
      stdio: "inherit",
    });
  } catch (err) {
    process.exit(err.status || 1);
  }
}

main();
