#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const net = require('net');

const root = process.cwd();
const envPath = path.join(root, '.env');

function exitWithHelp(msg) {
  console.log('\n' + msg + '\n');
  console.log('To enable automatic setup, create a `.env` from `.env.example` and ensure PostgreSQL is reachable.');
  console.log('Example: copy `.env.example` to `.env` and edit `DATABASE_URL` accordingly.');
  process.exit(1);
}

if (!fs.existsSync(envPath)) {
  console.log('.env not found. Skipping automatic setup.');
  exitWithHelp('Missing .env file.');
}

const content = fs.readFileSync(envPath, 'utf8');
const m = content.match(/^\s*DATABASE_URL\s*=\s*(?:"|')?(.*?)(?:"|')?\s*$/m);
if (!m) {
  exitWithHelp('DATABASE_URL is not present in .env.');
}

const dbUrl = m[1];
let parsed;
try {
  parsed = new URL(dbUrl);
} catch (err) {
  exitWithHelp('DATABASE_URL could not be parsed as a URL.');
}

if (!/^postgres(?:ql)?:$/i.test(parsed.protocol)) {
  exitWithHelp(`DATABASE_URL protocol is not postgres: ${parsed.protocol}`);
}

const host = parsed.hostname || 'localhost';
const port = Number(parsed.port || 5432);

console.log(`Checking PostgreSQL connectivity to ${host}:${port} ...`);

const socket = new net.Socket();
const timeoutMs = 3000;

let finished = false;
socket.setTimeout(timeoutMs);
socket.on('connect', () => {
  finished = true;
  console.log(`OK: able to reach ${host}:${port}`);
  socket.destroy();
  process.exit(0);
});
socket.on('timeout', () => {
  if (finished) return;
  console.error(`Timeout connecting to ${host}:${port}`);
  socket.destroy();
  exitWithHelp('Timed out connecting to the database host.');
});
socket.on('error', (err) => {
  if (finished) return;
  console.error(`Error connecting to ${host}:${port}: ${err.message}`);
  exitWithHelp('Could not connect to the database host.');
});

socket.connect(port, host);
