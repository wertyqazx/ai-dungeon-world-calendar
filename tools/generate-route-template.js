#!/usr/bin/env node
const fs = require("node:fs");

const filename = process.argv[2];
const placeholderDays = Number(process.argv[3] || 30);

if (!filename) {
  throw new Error("Usage: node tools/generate-route-template.js <locations.json> [placeholder-days]");
}
if (!Number.isInteger(placeholderDays) || placeholderDays < 1) {
  throw new Error("placeholder-days must be a positive integer");
}

const nodes = JSON.parse(fs.readFileSync(filename, "utf8"));
if (!Array.isArray(nodes) || nodes.length < 2) {
  throw new Error("The input file must contain at least two location objects");
}

const ids = nodes.map((node) => String(node && node.id || "").trim());
if (ids.some((id) => !/^[a-z0-9_]+$/.test(id))) {
  throw new Error("Every location id must use lowercase letters, numbers, and underscores only");
}
if (new Set(ids).size !== ids.length) {
  throw new Error("Every location id must be unique");
}

const pairs = [];
for (let first = 0; first < ids.length; first++) {
  for (let second = first + 1; second < ids.length; second++) {
    pairs.push([... [ids[first], ids[second]]].sort().join("|"));
  }
}
pairs.sort((a, b) => a.localeCompare(b));

process.stdout.write(pairs.map((pair) => `    "${pair}": ${placeholderDays}`).join(",\n") + "\n");
process.stderr.write(`${ids.length} locations -> ${pairs.length} route pairs\n`);
