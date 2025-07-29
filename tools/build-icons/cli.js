#!/usr/bin/env node

// Wrapper script to run cli.ts with tsx
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cliPath = path.join(__dirname, 'cli.ts');
const args = process.argv.slice(2);

// Use tsx to run the TypeScript file
const child = spawn('pnpm', ['tsx', cliPath, ...args], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('exit', (code) => {
  process.exit(code);
});