/** Chrome DevTools Protocol ka chhota client — bina kisi npm package ke. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function launch(port = 9000 + Math.floor(Math.random() * 900)) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--disable-extensions', '--mute-audio',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, 'about:blank'
  ], { stdio: 'ignore' });

  // agar is port par pehle se koi Chrome hai to hum uske purane cache se jud jaate —
  // isliye pehle hi jaanch lo ki port khaali tha
  let target = null;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find(t => t.type === 'page');
      if (target) break;
    } catch (_) {}
  }
  if (!target) { proc.kill(); throw new Error('Chrome start nahi hua'); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const events = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method && events.has(msg.method)) {
      events.get(msg.method).forEach(fn => fn(msg.params));
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
    setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); reject(new Error(method + ' timeout')); } }, 60000);
  });
  const on = (method, fn) => {
    if (!events.has(method)) events.set(method, []);
    events.get(method).push(fn);
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  /* --------------------------------------------------------- helpers */
  const api = {
    send, on,
    async viewport(width, height, mobile = false) {
      await send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: mobile ? 2 : 1, mobile,
        screenWidth: width, screenHeight: height
      });
      if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    },
    async goto(url, waitMs = 900) {
      const done = new Promise(res => {
        const h = () => { off(); res(); };
        const off = () => { const arr = events.get('Page.loadEventFired') || []; const i = arr.indexOf(h); if (i > -1) arr.splice(i, 1); };
        on('Page.loadEventFired', h);
        setTimeout(() => { off(); res(); }, 15000);
      });
      await send('Page.navigate', { url });
      await done;
      await new Promise(r => setTimeout(r, waitMs));
    },
    async eval(expr) {
      const r = await send('Runtime.evaluate', {
        expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true
      });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error');
      return r.result.value;
    },
    async click(selector) {
      const box = await api.eval(`
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        el.scrollIntoView({block:'center'});
        await new Promise(r=>setTimeout(r,220));
        const r0 = el.getBoundingClientRect();
        return { x: r0.left + r0.width/2, y: r0.top + r0.height/2 };`);
      if (!box) throw new Error('element nahi mila: ' + selector);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      }
      await new Promise(r => setTimeout(r, 320));
    },
    async type(selector, text) {
      await api.eval(`
        const el = document.querySelector(${JSON.stringify(selector)});
        el.focus(); el.value = ${JSON.stringify(text)};
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));`);
    },
    async screenshot(file, fullPage = false) {
      const r = await send('Page.captureScreenshot', {
        format: 'jpeg', quality: 82, captureBeyondViewport: fullPage
      });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
      return file;
    },
    async close() { try { ws.close(); } catch (_) {} proc.kill(); }
  };
  return api;
}

module.exports = { launch };
