#!/usr/bin/env node
// Headless render driver for Motion Canvas projects.
// Drives the editor (Video Settings -> RENDER) with Playwright, polls the
// image-sequence output until stable, and reports the frame directory.
// Encode to MP4 separately with the shared ffmpeg recipe (see SKILL.md).
//
// Usage:
//   node <skill-dir>/scripts/render.mjs --project <dir> [--range 0-2] [--timeout-min 10]
//
// Requires: node16+, Playwright + Chromium (see preflight), project deps installed.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : (process.argv[i + 1] ?? def);
}

const project = path.resolve(arg('project') ?? '');
if (!project || !fs.existsSync(path.join(project, 'package.json'))) {
  console.error('error: --project <motion-canvas project dir> is required');
  process.exit(2);
}
const range = arg('range'); // e.g. "0-2" = first 2 seconds (draft) or null (full)
const timeoutMin = parseFloat(arg('timeout-min', '10'));
const OUT = path.join(project, 'output');
const META = path.join(project, 'src', 'project.meta');
const URL = 'http://localhost:9000/';

async function portOpen() {
  try {
    await fetch(URL, {signal: AbortSignal.timeout(3000)});
    return true;
  } catch {
    return false;
  }
}

let child = null;
if (!(await portOpen())) {
  child = spawn('npm', ['run', 'serve'], {cwd: project, shell: true, stdio: 'ignore'});
  const start = Date.now();
  while (!(await portOpen())) {
    if (Date.now() - start > 120000) {
      console.error('error: editor did not start on :9000 within 120s');
      child.kill();
      process.exit(1);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Playwright resolves from the VIDEO project (each video project owns its
// toolchain: `npm i -D playwright` once per project; browsers cached per machine).
let chromium;
try {
  const require = createRequire(path.join(project, 'package.json'));
  ({chromium} = require('playwright'));
} catch {
  console.error('error: playwright missing in video project — run `npm i -D playwright` there first');
  process.exit(2);
}

// Video Settings live in src/project.meta (plain JSON, editor-managed).
// Drafts override shared.range in SECONDS; the original is always restored,
// so a draft range can never leak into the final render.
let metaBackup = null;
if (range) {
  const [start, end] = range.split('-').map(Number);
  if (!fs.existsSync(META)) {
    console.error('error: src/project.meta not found — open the project in the editor once first');
    process.exit(2);
  }
  metaBackup = fs.readFileSync(META, 'utf8');
  const meta = JSON.parse(metaBackup);
  meta.shared = meta.shared ?? {};
  meta.shared.range = [start, end];
  fs.writeFileSync(META, JSON.stringify(meta, null, 2));
  console.log(`draft range: first ${start}s-${end}s (restored after render)`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport: {width: 1600, height: 900}});
  await page.goto(URL, {waitUntil: 'networkidle'});
  await page.waitForTimeout(5000);

  if (fs.existsSync(OUT)) fs.rmSync(OUT, {recursive: true, force: true});
  await page.getByRole('button', {name: 'RENDER'}).click();
  console.log('RENDER started');

  const count = () =>
    fs.existsSync(OUT)
      ? fs.readdirSync(OUT, {recursive: true}).filter(f => f.endsWith('.png')).length
      : 0;
  const deadline = Date.now() + timeoutMin * 60000;
  let last = -1, stable = 0, n = 0;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 10000));
    n = count();
    console.log(`frames: ${n}`);
    if (n === last && n > 0 && ++stable >= 2) break;
    if (n !== last) stable = 0;
    last = n;
  }
  if (n === 0) {
    console.error('error: no frames rendered (see troubleshooting.md)');
    process.exitCode = 1;
  } else {
    console.log(`render complete: ${n} frames in ${OUT}`);
  }
} finally {
  await browser.close();
  if (metaBackup !== null) {
    fs.writeFileSync(META, metaBackup);
    console.log('project.meta restored');
  }
  if (child) child.kill();
}
