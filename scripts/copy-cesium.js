/* Copy Cesium static assets into dist/cesium for production hosting (Vercel).
 * Run automatically in the build script (see package.json postbuild).
 */
const fs = require("fs");
const path = require("path");

const cesiumSource = path.join(
  __dirname,
  "..",
  "node_modules",
  "cesium",
  "Build",
  "Cesium"
);
const cesiumDest = path.join(__dirname, "..", "public", "cesium");

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

if (!fs.existsSync(cesiumSource)) {
  console.error("Cesium source assets not found at", cesiumSource);
  process.exit(1);
}

copyDir(cesiumSource, cesiumDest);
console.log("Cesium assets copied to /public/cesium");
