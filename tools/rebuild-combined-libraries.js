const fs = require("node:fs");

const corePath = process.argv[2];
const combinedPaths = process.argv.slice(3);
if (!corePath || combinedPaths.length === 0) {
  throw new Error(
    "Usage: node tools/rebuild-combined-libraries.js <calendar-only.js> <combined.js> [...]"
  );
}

const core = fs.readFileSync(corePath, "utf8").trimEnd();
const versionMatch = core.match(/^\/\/ AI Dungeon World Calendar (v\d+\.\d+\.\d+)$/m);
const configStart = core.indexOf("/**\n * Creator configuration.");
const engineStart = core.indexOf("function WorldCalendar");
if (!versionMatch || configStart < 0 || engineStart < 0) {
  throw new Error("Could not split the standalone calendar into configuration and engine blocks.");
}

const calendarVersion = versionMatch[1];
const config = core.slice(configStart, engineStart).trim();
const engine = core.slice(engineStart).trim();

for (const path of combinedPaths) {
  const source = fs.readFileSync(path, "utf8");
  const componentStart = source.indexOf('// Your "Library" tab should look like this');
  const endMarkers = [
    source.indexOf("// ——— World Calendar overlay ———", componentStart),
    source.indexOf("// ——— World Calendar engine ———", componentStart),
    source.search(/^\/\/ AI Dungeon World Calendar v\d+\.\d+\.\d+$/m)
  ].filter((index) => index > componentStart);
  const componentEnd = endMarkers.length ? Math.min(...endMarkers) : -1;
  if (componentStart < 0 || componentEnd < 0) {
    throw new Error(`Could not isolate the bundled component source in ${path}`);
  }

  const component = source.slice(componentStart, componentEnd).trim();
  const isInnerSelf = /inner-self/i.test(path);
  const header = isInnerSelf
    ? `// AI Dungeon World Calendar + Inner Self + Auto-Cards ${calendarVersion} (experimental)\n// Inner Self v1.0.2 + Auto-Cards v1.1.3 + World Calendar ${calendarVersion}`
    : `// AI Dungeon World Calendar + Auto-Cards ${calendarVersion} (recommended)\n// Auto-Cards v1.1.3 + World Calendar ${calendarVersion}`;

  fs.writeFileSync(
    path,
    `${header}\n\n${config}\n\n${component}\n\n// ——— World Calendar engine ———\n\n${engine}\n`
  );
}
