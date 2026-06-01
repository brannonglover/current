#!/usr/bin/env node
/**
 * Syncs version metadata across package.json, backend/package.json, and the iOS
 * Xcode project (when present). During EAS iOS builds, we also stamp a fresh
 * CURRENT_PROJECT_VERSION so App Store submissions do not reuse an old build.
 *
 * Run manually with: node scripts/sync-version.js
 * Include a fresh iOS build number with: node scripts/sync-version.js --with-build-number
 * Or automatically via: npm run version:sync / eas-build-pre-install
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appConfigPath = path.join(rootDir, "app.config.js");
const backendPkgPath = path.join(rootDir, "backend", "package.json");
const includeBuildNumber = process.argv.includes("--with-build-number");

const { expo } = require(appConfigPath);
const version = expo.version;
const buildNumber = expo.ios?.buildNumber;

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function findIosProjectFile() {
  const iosDir = path.join(rootDir, "ios");
  if (!fs.existsSync(iosDir)) return null;
  const xcodeproj = fs.readdirSync(iosDir).find((entry) => entry.endsWith(".xcodeproj"));
  if (!xcodeproj) return null;
  return path.join(iosDir, xcodeproj, "project.pbxproj");
}

function replaceAllOrThrow(contents, pattern, replaceWith, label, filePath) {
  if (!pattern.test(contents)) {
    throw new Error(`Unable to find ${label} in ${path.basename(filePath)}`);
  }
  return contents.replace(pattern, replaceWith);
}

const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, "utf8"));
backendPkg.version = version;
writeJson(backendPkgPath, backendPkg);

const iosProjectPath = findIosProjectFile();
if (iosProjectPath) {
  let iosProject = fs.readFileSync(iosProjectPath, "utf8");
  iosProject = replaceAllOrThrow(
    iosProject,
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${version};`,
    "MARKETING_VERSION",
    iosProjectPath
  );

  if (includeBuildNumber) {
    iosProject = replaceAllOrThrow(
      iosProject,
      /CURRENT_PROJECT_VERSION = [^;]+;/g,
      `CURRENT_PROJECT_VERSION = ${buildNumber};`,
      "CURRENT_PROJECT_VERSION",
      iosProjectPath
    );
  }

  fs.writeFileSync(iosProjectPath, iosProject);
  console.log(`Synced version ${version} to backend/package.json and ${path.relative(rootDir, iosProjectPath)}`);
  if (includeBuildNumber) {
    console.log(`Stamped iOS CURRENT_PROJECT_VERSION ${buildNumber}`);
  }
} else {
  console.log(`Synced version ${version} to backend/package.json (no ios/ Xcode project yet)`);
}
