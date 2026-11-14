/**
 * StickForge 2D - Amazon Amplify Build & Packaging Script
 * Cross-platform Node.js packager for AWS Amplify Hosting.
 * Assembles static production bundle into dist/ directory.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('⚡ [StickForge Amplify Build] Starting build for AWS Amplify Hosting...');

// 1. Ensure clean dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Helper: Recursive copy
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 2. Files and directories to package for static CDN hosting
const itemsToCopy = [
  'index.html',
  'manifest.json',
  'robots.txt',
  'assets'
];

let copiedCount = 0;
for (const item of itemsToCopy) {
  const srcPath = path.join(ROOT_DIR, item);
  const destPath = path.join(DIST_DIR, item);
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    copiedCount++;
    console.log(`  ✓ Copied ${item}`);
  } else {
    console.warn(`  ⚠️ Warning: ${item} not found at ${srcPath}`);
  }
}

// 3. Create Amplify deployment metadata
const buildMeta = {
  appName: 'StickForge 2D Studio',
  version: '5.0.0',
  buildTime: new Date().toISOString(),
  target: 'AWS Amplify Hosting',
  cdnReady: true
};
fs.writeFileSync(path.join(DIST_DIR, 'build-meta.json'), JSON.stringify(buildMeta, null, 2));

console.log(`✨ [StickForge Amplify Build] Successfully built static web bundle in dist/ (${copiedCount} targets copied).`);
