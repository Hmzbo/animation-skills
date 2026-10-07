#!/usr/bin/env node
// Headless frame-stepper for Three.js video projects.
// Serves the project (stdlib HTTP, import map -> node_modules/three),
// steps window.__renderAt(t) deterministically, screenshots the canvas per
// frame, and reports the frame directory. Encode to MP4 separately (see SKILL.md).
//
// Video project layout: index.html + scene.mjs (+ node_modules with three,
// playwright). Scene contract: window.__renderAt(t), window.__meta.
// Usage:
//   node <skill-dir>/scripts/render.mjs --project <dir> [--frames 60] [--port 8123] [--timeout-min 10]
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
import path from 'node:path';

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : (process.argv[i + 1] ?? def);
}

const project = path.resolve(arg('project') ?? '');
if (!project || !fs.existsSync(path.join(project, 'index.html'))) {
  console.error('error: --project <dir with index.html + scene.mjs> is required');
  process.exit(2);
}
const port = parseInt(arg('port', '8123'), 10);
const timeoutMin = parseFloat(arg('timeout-min', '10'));
const FRAMES = path.join(project, 'frames');
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json'};

let chromium;
try {
  const require = createRequire(path.join(project, 'package.json'));
  ({chromium} = require('playwright'));
} catch {
  console.error('error: playwright missing in video project — run `npm i -D playwright` there first');
  process.exit(2);
}

const server = http.createServer((req, res) => {
  const file = path.join(project, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('nf');
      return;
    }
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream'});
    res.end(data);
  });
});
let serving = false;
await new Promise(resolve => {
  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`port ${port} busy — reusing running server`);
      resolve();
    } else {
      console.error(`error: cannot serve on :${port}: ${err.message}`);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    serving = true;
    resolve();
  });
});

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  await page.goto(`http://localhost:${port}/index.html`, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => typeof window.__renderAt === 'function', null, {timeout: 60000});
  if (errors.length) {
    console.error(`error: scene threw on load: ${errors[0]}`);
    process.exitCode = 1;
  } else {
  const meta = await page.evaluate(() => window.__meta);
  const total = parseInt(arg('frames', String(Math.round(meta.fps * meta.duration))), 10);
  await page.setViewportSize({width: meta.width, height: meta.height});
  if (fs.existsSync(FRAMES)) fs.rmSync(FRAMES, {recursive: true, force: true});
  fs.mkdirSync(FRAMES, {recursive: true});

  const canvas = page.locator('canvas');
  const start = Date.now();
  for (let i = 0; i < total; i++) {
    if (Date.now() - start > timeoutMin * 60000) {
      console.error(`error: timed out after ${i}/${total} frames`);
      process.exitCode = 1;
      break;
    }
    await page.evaluate(t => window.__renderAt(t), i / meta.fps);
    await canvas.screenshot({path: path.join(FRAMES, `${String(i).padStart(6, '0')}.png`)});
    if (i % 60 === 0) console.log(`frame ${i}/${total}`);
  }
  console.log(`render complete: ${total} frames in ${FRAMES} (${meta.width}x${meta.height}@${meta.fps})`);
  }
} finally {
  await browser.close();
  if (serving) server.close();
}
