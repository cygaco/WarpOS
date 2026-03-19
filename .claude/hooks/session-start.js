#!/usr/bin/env node
// SessionStart hook: runs once when a Claude Code session begins.
// Checks environment health and reports status via stderr (non-blocking).

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(input);
    const cwd = event.cwd;
    const checks = [];

    // 1. Check git branch
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
        .toString().trim();
      const status = execSync('git status --porcelain', { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
        .toString().trim();
      const uncommitted = status ? status.split('\n').length : 0;
      checks.push(`Branch: ${branch}${uncommitted ? ` (${uncommitted} uncommitted)` : ''}`);
    } catch {
      checks.push('Git: not available');
    }

    // 2. Check .env.local exists
    const envPath = path.join(cwd, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const keys = ['ANTHROPIC_API_KEY', 'BRIGHTDATA_API_KEY', 'UPSTASH_REDIS_REST_URL'];
      const missing = keys.filter(k => !envContent.includes(k + '='));
      if (missing.length > 0) {
        checks.push(`Env: missing ${missing.join(', ')}`);
      } else {
        checks.push('Env: all keys present');
      }
    } else {
      checks.push('Env: .env.local not found');
    }

    // 3. Check node_modules exists
    if (!fs.existsSync(path.join(cwd, 'node_modules'))) {
      checks.push('node_modules: MISSING — run npm install');
    }

    // 4. Check for backup branch safety
    try {
      const branches = execSync('git branch', { cwd, stdio: ['pipe', 'pipe', 'pipe'] }).toString();
      if (branches.includes('backup-2026-03-18')) {
        checks.push('Backup branch: safe');
      }
    } catch { /* ignore */ }

    // Output as a startup banner via stderr (shown to Claude as context)
    if (checks.length > 0) {
      process.stderr.write(`[Session Start] ${checks.join(' | ')}\n`);
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
});
