// capture.mjs — takes the entry's four screenshots with the machine's Chromium
// over the DevTools protocol (Node standard library only). This Chromium build
// refuses localhost navigation (Local Network Access checks), so the app is
// served to the page by request interception: the browser navigates to a fake
// https origin and every request is fulfilled from app/ on disk — the same
// bytes `node serve.ts` would serve, rendered by the same engine. Each shot
// drives the real UI: seeded localStorage progress, real control events, real
// scroll positions. Captures are written unedited to screenshots/; JPEG
// quality steps down until a file fits the gate's 256 KiB cap. Console errors
// are collected and reported.
import { spawn } from 'node:child_process';
import { writeFileSync, statSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const APP_URL = 'https://ledger.invalid/';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};
const PORT = 9333;
const VIEW = { width: 1280, height: 800 };
const EARNED_SEED = [2, 3, 4, 8, 20, 21, 22, 28, 33, 35, 37, 38, 44, 46, 49, 50, 55];
const MAX_BYTES = 250 * 1024;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDebugger() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error('chrome debugger never came up');
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method && listeners.has(msg.method)) {
      for (const fn of listeners.get(msg.method)) fn(msg.params);
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return {
    ready,
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    on(method, fn) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(fn);
    },
    close() { ws.close(); },
  };
}

let cdp;
const consoleProblems = [];

async function evaluate(expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(`page evaluate failed: ${result.exceptionDetails.text} ${JSON.stringify(result.exceptionDetails.exception?.description || '')}`);
  }
  return result.result.value;
}

async function waitForRows(count) {
  for (let i = 0; i < 40; i++) {
    const n = await evaluate(`document.querySelectorAll('.trophy-row').length`);
    if (n === count) return;
    await sleep(400);
  }
  throw new Error(`app never rendered ${count} rows`);
}

async function shoot(file, quality) {
  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg', quality, captureBeyondViewport: false,
  });
  const path = join(repo, 'screenshots', file);
  writeFileSync(path, Buffer.from(shot.data, 'base64'));
  return statSync(path).size;
}

async function shootFitting(file) {
  let quality = 84;
  let size = await shoot(file, quality);
  while (size > MAX_BYTES && quality > 40) {
    quality -= 10;
    size = await shoot(file, quality);
  }
  console.log(`${file}: ${size} bytes at quality ${quality}`);
  return size;
}

async function main() {
  rmSync('/tmp/ledger-chrome-profile', { recursive: true, force: true });
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    // This Chromium build refuses to start without its WebGL domain policy.
    '--hatch-webgl-allowed-domains-file=/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt',
    '--hatch-webgl-allowed-domains-sha256=8097045f0459c96c4cdc76e3a1af4e0f43f640b4b59c43d6db35e3641c0264c6',
    `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/ledger-chrome-profile',
    `--window-size=${VIEW.width},${VIEW.height}`, 'about:blank',
  ], { stdio: 'ignore' });
  try {
    const wsUrl = await waitForDebugger();
    cdp = connect(wsUrl);
    await cdp.ready;
    cdp.on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error') consoleProblems.push(p.args?.map((a) => a.value || a.description || '').join(' '));
    });
    cdp.on('Log.entryAdded', (p) => {
      if (p.entry.level === 'error') consoleProblems.push(p.entry.text);
    });
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: VIEW.width, height: VIEW.height, deviceScaleFactor: 1, mobile: false,
    });
    // Serve app/ from disk under the fake origin: every request is paused and
    // fulfilled with the file's exact bytes before any network is touched.
    cdp.on('Fetch.requestPaused', async (p) => {
      const url = new URL(p.request.url);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = join(repo, 'app', pathname);
      const params = { requestId: p.requestId };
      if (existsSync(file)) {
        params.responseCode = 200;
        params.responseHeaders = [{ name: 'Content-Type', value: MIME[extname(file).toLowerCase()] || 'application/octet-stream' }];
        params.body = readFileSync(file).toString('base64');
      } else {
        params.responseCode = 404;
        params.body = Buffer.from('not found').toString('base64');
      }
      try { await cdp.send('Fetch.fulfillRequest', params); } catch { /* page gone */ }
    });
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: `${APP_URL}*`, requestStage: 'Request' }] });
    await cdp.send('Page.navigate', { url: APP_URL });
    await waitForRows(55);

    // Seed a realistic week-one progress set, then reload so the app boots on it.
    await evaluate(`localStorage.setItem('leonida-ledger-v3-progress', ${JSON.stringify(JSON.stringify(EARNED_SEED))})`);
    await cdp.send('Page.reload');
    await waitForRows(55);

    // Shot 1 — the guide in use: roadmap strip, list, Actions Speak Louder open.
    await evaluate(`location.hash = 'trophy=48'`);
    await cdp.send('Page.reload');
    await waitForRows(55);
    await evaluate(`window.scrollTo(0, 0)`);
    await sleep(600);
    await shootFitting('01-guide-in-use.jpg');

    // Shot 2 — rarity board: rarest first, spoiler shield on (secrets masked).
    await evaluate(`(() => {
      const sort = document.getElementById('sort-mode');
      sort.value = 'rarest';
      sort.dispatchEvent(new Event('change', { bubbles: true }));
      const shield = document.getElementById('spoiler-shield');
      if (!shield.checked) { shield.checked = true; shield.dispatchEvent(new Event('change', { bubbles: true })); }
      window.scrollTo(0, 0);
    })()`);
    await sleep(600);
    await shootFitting('02-rarity-and-filters.jpg');

    // Shot 3 — a trophy detail: Don't Touch My Deck, shield off again.
    await evaluate(`(() => {
      const shield = document.getElementById('spoiler-shield');
      if (shield.checked) { shield.checked = false; shield.dispatchEvent(new Event('change', { bubbles: true })); }
      const sort = document.getElementById('sort-mode');
      sort.value = 'order';
      sort.dispatchEvent(new Event('change', { bubbles: true }));
      const rows = document.querySelectorAll('.trophy-row');
      rows[29].scrollIntoView({ block: 'center' });
      rows[29].click();
    })()`);
    await sleep(600);
    await shootFitting('03-trophy-detail.jpg');

    // Shot 4 — the platinum roadmap section, heading clear of the sticky toolbar.
    await evaluate(`(() => {
      const y = document.getElementById('roadmap').getBoundingClientRect().top + window.scrollY - 118;
      window.scrollTo(0, y);
    })()`);
    await sleep(600);
    await shootFitting('04-platinum-roadmap.jpg');

    console.log(`console errors: ${consoleProblems.length}`);
    for (const p of consoleProblems) console.log(`  ERROR: ${p}`);
  } finally {
    if (cdp) cdp.close();
    chrome.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
