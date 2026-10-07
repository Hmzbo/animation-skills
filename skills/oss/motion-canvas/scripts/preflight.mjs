#!/usr/bin/env node
// Preflight for the motion-canvas skill: node/npm/ffmpeg + scaffold sanity.
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
function major(cmd, flag) {
  // Note: on Windows, npm is an npm.cmd shim — execFileSync needs a shell to see it.
  const opts = {encoding: 'utf8'};
  if (process.platform === 'win32' && cmd === 'npm') opts.shell = true;
  const v = execFileSync(cmd, [flag], opts).trim();
  const m = v.match(/v?(\d+)\./);
  return {raw: v.split('\n')[0], major: m ? parseInt(m[1], 10) : NaN};
}

const node = major('node', '-v');
check(`node >= 16 (have ${node.raw})`, () => {
  if (!(node.major >= 16)) throw new Error('too old');
  return node.raw;
});
check('npm on PATH', () => major('npm', '-v').raw);
check('ffmpeg on PATH (or rely on bundled exporter binary)', () => {
  try {
    return major('ffmpeg', '-version').raw;
  } catch {
    console.log('     note: @motion-canvas/ffmpeg bundles its own binary');
    return 'bundled fallback';
  }
});

console.log(failures ? `\n${failures} hard failure(s) — fix before planning.` : '\npreflight clean.');
process.exit(failures ? 1 : 0);
