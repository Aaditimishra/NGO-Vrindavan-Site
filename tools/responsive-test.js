/** Har page ko har screen size par jaanchta hai — horizontal overflow, chhote tap targets, chhota text. */
const { launch } = require('./cdp');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:3400';
const SHOTS = process.env.SHOTS || '/tmp/shots';
const PAGES = ['/', '/about', '/seva', '/gallery', '/events', '/donate', '/volunteer', '/contact', '/blog'];
const SIZES = [
  { name: 'mobile-360', w: 360, h: 740, mobile: true },
  { name: 'mobile-390', w: 390, h: 844, mobile: true },
  { name: 'tablet-768', w: 768, h: 1024, mobile: true },
  { name: 'laptop-1280', w: 1280, h: 800, mobile: false },
  { name: 'desktop-1440', w: 1440, h: 900, mobile: false }
];

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const b = await launch();
  const problems = [];
  let checks = 0;

  for (const size of SIZES) {
    await b.viewport(size.w, size.h, size.mobile);
    for (const p of PAGES) {
      await b.goto(BASE + p);
      const r = await b.eval(`
        const de = document.documentElement;
        const vw = de.clientWidth;
        // kaun se element viewport se bahar nikal rahe hain
        const over = [];
        // koi purvaj overflow hidden/clip karta ho to element clip ho chuka hai —
        // wo page ko chauda nahi karta, isliye use ginti me na lo
        const clipped = (el) => {
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const s = getComputedStyle(a);
            if (/hidden|clip|auto|scroll/.test(s.overflowX)) return true;
          }
          return false;
        };
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
          if (clipped(el)) continue;
          const b0 = el.getBoundingClientRect();
          if (b0.width === 0) continue;
          if (b0.right > vw + 1.5 || b0.left < -1.5) {
            const sel = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.') : '');
            over.push({ sel, left: Math.round(b0.left), right: Math.round(b0.right),
                        text: (el.textContent||'').trim().slice(0,40) });
          }
        }
        // chhote tap target (mobile)
        const small = [];
        for (const el of document.querySelectorAll('a, button')) {
          const b0 = el.getBoundingClientRect();
          if (b0.width === 0 || b0.height === 0) continue;
          if (b0.height < 30 && el.offsetParent !== null) {
            small.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
          }
        }
        const _d = document.getElementById('navDrawer');
        const _cs = _d ? getComputedStyle(_d) : null;
        return {
          probe: _d ? (_cs.position + '/' + _cs.display + '/' + Math.round(_d.getBoundingClientRect().width)) : 'NO-DRAWER',
          scrollW: de.scrollWidth, vw,
          overflowsPage: de.scrollWidth > vw + 1,
          scrollW2: de.scrollWidth,
          over: over.slice(0, 6),
          smallTargets: [...new Set(small)].slice(0, 5)
        };`);
      checks++;
      if (r.overflowsPage || r.over.length) {
        problems.push({ size: size.name, page: p, scrollW: r.scrollW, vw: r.vw, over: r.over });
      }
      if (size.mobile && size.w <= 390 && r.smallTargets.length) {
        problems.push({ size: size.name, page: p, small: r.smallTargets });
      }
    }
    // har size par home ka screenshot
    await b.goto(BASE + '/');
    await b.screenshot(path.join(SHOTS, `home-${size.name}.jpg`));
  }

  await b.close();

  console.log(`\n${'═'.repeat(58)}\n  RESPONSIVE जाँच — ${checks} संयोजन (${PAGES.length} पेज × ${SIZES.length} स्क्रीन)\n${'═'.repeat(58)}`);
  if (!problems.length) {
    console.log('  ✅ कोई horizontal overflow नहीं, कोई छोटा tap target नहीं');
  } else {
    for (const pr of problems) {
      if (pr.small) { console.log(`\n  ⚠️  ${pr.size}  ${pr.page} — छोटे tap target: ${pr.small.join(', ')}`); continue; }
      console.log(`\n  ❌ ${pr.size}  ${pr.page}  → scrollWidth ${pr.scrollW} > viewport ${pr.vw}`);
      pr.over.forEach(o => console.log(`       ${o.sel}  [${o.left} → ${o.right}]  "${o.text}"`));
    }
  }
  console.log(`\n  स्क्रीनशॉट: ${SHOTS}\n`);
  process.exit(problems.filter(p => !p.small).length ? 1 : 0);
})().catch(e => { console.error('💥', e.message); process.exit(1); });
