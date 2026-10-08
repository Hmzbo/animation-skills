#!/usr/bin/env node
// Preflight for the gsap-motion skill: node/npm/ffmpeg + license reminder.
// Run: node <skill-dir>/scripts/preflight.mjs
import {execFileSync} from 'node:child_process';

let failures = 0;
function check(label, fn) {
  try {
    const out = fn();
    console.log(`ok   ${label}${out ? ` (${out})` : ''}`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${label}: ${e.message.split('\n')[0]}`);
  }
}
function run(cmd, args) {
  const opts = {encoding: 'utf8'};
  if (process.platform === 'win32' && (cmd === 'npm' || cmd === 'npx')) opts.shell = true;
  return execFileSync(cmd, args, opts).trim().split('\n')[0];
}

const nodeMajor = parseInt(run('node', ['-v']).match(/v?(\d+)\./)[1], 10);
check(`node >= 16 (have v${nodeMajor})`, () => {
  if (!(nodeMajor >= 16)) throw new Error('too old');
  return `v${nodeMajor}`;
});
check('npm on PATH', () => run('npm', ['-v']));
check('ffmpeg on PATH', () => run('ffmpeg', ['-version']));
console.log('note  GSAP is gratis but PROPRIETARY (Standard License, non-compete):');
console.log('      confirm https://gsap.com/community/standard-license/ covers your use.');
console.log('info  per video project: npm i gsap playwright && npx playwright install chromium');

console.log(failures ? `\n${failures} hard failure(s) — fix before planning.` : '\npreflight clean.');
process.exit(failures ? 1 : 0);
