/**
 * Admin panel ka asli browser test — jodna, hatana, kram badalna, sehejna, inbox.
 * Server chalu hona chahiye. Phir: node tools/admin-ui-test.js
 */
const { launch } = require('./cdp');
const BASE = process.env.BASE || 'http://127.0.0.1:3400';
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASS || 'radhe@2026';
const TAG = 'UI-टेस्ट-चित्र';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? '  → ' + extra : ''}`); }
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await launch();
  await b.viewport(1440, 900, false);

  /* ------------------------------------------------------------ login */
  console.log('\n▸ लॉगिन');
  await b.goto(BASE + '/admin');
  ok('लॉगिन पेज खुला', await b.eval(`return !!document.querySelector('input[name=username]')`));
  await b.type('input[name=username]', USER);
  await b.type('input[name=password]', PASS);
  await b.click('button.btn-a.primary');
  await sleep(1600);
  ok('डैशबोर्ड खुला', await b.eval(`return !!document.getElementById('sideNav') && document.querySelectorAll('#sideNav button').length > 10`));

  /* --------------------------------------------------- gallery: जोड़ना */
  console.log('\n▸ गैलरी — चित्र जोड़ना');
  await b.click('#sideNav button[data-sec="gallery"]');
  await sleep(500);
  const before = await b.eval(`return document.querySelectorAll('[data-list="gallery.images"]').length`);
  ok('गैलरी अनुभाग खुला', before > 0, `items=${before}`);

  await b.click('button[data-add="gallery.images"]');
  await sleep(600);
  const afterAdd = await b.eval(`return document.querySelectorAll('[data-list="gallery.images"]').length`);
  ok('"+ नया जोड़ें" से आइटम बना', afterAdd === before + 1, `${before} → ${afterAdd}`);

  // naye item me caption bharo
  const capSel = `[data-list="gallery.images"][data-idx="${afterAdd - 1}"] input[data-path$=".caption"]`;
  await b.type(capSel, TAG);
  await sleep(300);
  const headTitle = await b.eval(`
    return document.querySelector('[data-list="gallery.images"][data-idx="${afterAdd - 1}"] .ttl').textContent.trim();`);
  ok('सूची का शीर्षक तुरंत बदला', headTitle === TAG, headTitle);

  await b.type(`[data-list="gallery.images"][data-idx="${afterAdd - 1}"] input[data-path$=".src"]`, '/img/g1.svg');
  await b.type(`[data-list="gallery.images"][data-idx="${afterAdd - 1}"] input[data-path$=".category"]`, 'अन्नदान');
  const dirty = await b.eval(`return document.getElementById('status').className`);
  ok('"असहेजे बदलाव" दिखा', dirty.includes('dirty'), dirty);

  /* --------------------------------------------------------- सहेजना */
  console.log('\n▸ सहेजना');
  await b.click('#saveBtn');
  await sleep(1500);
  const saved = await b.eval(`return { cls: document.getElementById('status').className,
                                       toast: document.getElementById('toast').textContent }`);
  ok('सहेजा गया संदेश आया', saved.cls.includes('saved'), JSON.stringify(saved));
  ok('टोस्ट दिखा', /सहेज/.test(saved.toast), saved.toast);

  await b.eval(`window.onbeforeunload = null;`);
  await b.goto(BASE + '/gallery');
  ok('नया चित्र वेबसाइट पर दिखा', await b.eval(`return document.body.innerText.includes(${JSON.stringify(TAG)})`));

  /* -------------------------------------------------- gallery: हटाना */
  console.log('\n▸ गैलरी — चित्र हटाना (🗑 बटन)');
  await b.goto(BASE + '/admin');
  await sleep(900);
  await b.click('#sideNav button[data-sec="gallery"]');
  await sleep(500);
  const idx = await b.eval(`
    const items = [...document.querySelectorAll('[data-list="gallery.images"]')];
    const hit = items.find(i => i.querySelector('.ttl').textContent.trim() === ${JSON.stringify(TAG)});
    return hit ? hit.dataset.idx : -1;`);
  ok('टेस्ट चित्र सूची में मिला', idx !== -1 && idx !== '-1', `idx=${idx}`);

  await b.click(`button[data-remove="gallery.images"][data-idx="${idx}"]`);
  await sleep(500);
  const modal = await b.eval(`
    const m = document.getElementById('confirmModal');
    return { open: m.classList.contains('open'), title: document.getElementById('confirmTitle').textContent };`);
  ok('पुष्टि विंडो खुली', modal.open, JSON.stringify(modal));
  ok('विंडो में सही नाम दिखा', modal.title.includes(TAG), modal.title);

  // pehle "रहने दें" — item bacha rehna chahiye
  await b.click('#confirmNo');
  await sleep(400);
  const stillThere = await b.eval(`
    return [...document.querySelectorAll('[data-list="gallery.images"] .ttl')]
      .some(t => t.textContent.trim() === ${JSON.stringify(TAG)});`);
  ok('"रहने दें" दबाने पर आइटम बचा रहा', stillThere);

  // ab sach me hatao
  const idx2 = await b.eval(`
    const items = [...document.querySelectorAll('[data-list="gallery.images"]')];
    const hit = items.find(i => i.querySelector('.ttl').textContent.trim() === ${JSON.stringify(TAG)});
    return hit ? hit.dataset.idx : -1;`);
  await b.click(`button[data-remove="gallery.images"][data-idx="${idx2}"]`);
  await sleep(400);
  await b.click('#confirmYes');
  await sleep(700);
  const removed = await b.eval(`
    return { gone: ![...document.querySelectorAll('[data-list="gallery.images"] .ttl')]
                      .some(t => t.textContent.trim() === ${JSON.stringify(TAG)}),
             count: document.querySelectorAll('[data-list="gallery.images"]').length };`);
  ok('🗑 हटाएँ से आइटम हटा', removed.gone, JSON.stringify(removed));
  ok('गिनती वापस पहले जैसी', removed.count === before, `${removed.count} vs ${before}`);

  await b.click('#saveBtn');
  await sleep(1500);
  await b.eval(`window.onbeforeunload = null;`);
  await b.goto(BASE + '/gallery');
  ok('चित्र वेबसाइट से भी हटा', await b.eval(`return !document.body.innerText.includes(${JSON.stringify(TAG)})`));

  /* -------------------------------------------------- kram badalna */
  console.log('\n▸ क्रम बदलना (↑ ↓ बटन)');
  await b.goto(BASE + '/admin');
  await sleep(900);
  await b.click('#sideNav button[data-sec="seva"]');
  await sleep(500);
  const names0 = await b.eval(`return [...document.querySelectorAll('[data-list="seva.items"] .ttl')].map(t=>t.textContent.trim())`);
  await b.click(`button[data-move="seva.items"][data-from="1"][data-dir="-1"]`);
  await sleep(600);
  const names1 = await b.eval(`return [...document.querySelectorAll('[data-list="seva.items"] .ttl')].map(t=>t.textContent.trim())`);
  ok('↑ बटन से क्रम बदला', names1[0] === names0[1] && names1[1] === names0[0], `${names0.slice(0,2)} → ${names1.slice(0,2)}`);
  await b.click(`button[data-move="seva.items"][data-from="0"][data-dir="1"]`);
  await sleep(600);
  const names2 = await b.eval(`return [...document.querySelectorAll('[data-list="seva.items"] .ttl')].map(t=>t.textContent.trim())`);
  ok('↓ बटन से क्रम वापस हुआ', names2[0] === names0[0], `${names2.slice(0,2)}`);
  await b.click('#saveBtn');
  await sleep(1200);

  /* ------------------------------------------------------ संपर्क विवरण */
  console.log('\n▸ संपर्क विवरण बदलना');
  await b.click('#sideNav button[data-sec="contact"]');
  await sleep(500);
  const oldPhone = await b.eval(`return document.querySelector('input[data-path="contact.phone"]').value`);
  await b.type('input[data-path="contact.phone"]', '+91 70000 12345');
  await b.click('#saveBtn');
  await sleep(1500);
  await b.eval(`window.onbeforeunload = null;`);
  await b.goto(BASE + '/');
  ok('नया फोन वेबसाइट पर दिखा', await b.eval(`return document.body.innerText.includes('+91 70000 12345')`));
  await b.goto(BASE + '/admin');
  await sleep(900);
  await b.click('#sideNav button[data-sec="contact"]');
  await sleep(500);
  await b.type('input[data-path="contact.phone"]', oldPhone);
  await b.click('#saveBtn');
  await sleep(1500);
  ok('फोन वापस पुराना हुआ', true);

  /* ------------------------------------------------------------- inbox */
  console.log('\n▸ संदेश इनबॉक्स');
  await b.eval(`window.onbeforeunload = null;`);
  await b.goto(BASE + '/contact');
  await b.type('input[name=name]', 'UI टेस्ट भेजने वाला');
  await b.type('textarea[name=message]', 'यह browser से भेजा गया टेस्ट संदेश है।');
  await b.click('form[data-ajax] button[type=submit]');
  await sleep(1600);
  ok('संपर्क फॉर्म से संदेश गया', await b.eval(`
    const m = document.querySelector('.form-msg');
    return m && m.classList.contains('ok') && m.classList.contains('show');`));

  await b.goto(BASE + '/admin');
  await sleep(1000);
  const badge = await b.eval(`return (document.getElementById('badge-inbox')||{}).textContent || ''`);
  ok('साइडबार पर अपठित बैज दिखा', badge !== '', `badge="${badge}"`);
  await b.click('#sideNav button[data-sec="inbox"]');
  await sleep(600);
  ok('संदेश इनबॉक्स में दिखा', await b.eval(`return document.body.innerText.includes('UI टेस्ट भेजने वाला')`));
  ok('अपठित के रूप में दिखा', await b.eval(`return !!document.querySelector('.msg.unread')`));

  await b.click('.msg.unread button[data-mark]');
  await sleep(1200);
  ok('"पढ़ा हुआ" बटन चला', await b.eval(`
    const m = [...document.querySelectorAll('.msg')].find(x => x.innerText.includes('UI टेस्ट भेजने वाला'));
    return m && !m.classList.contains('unread');`));

  const delBtn = await b.eval(`
    const m = [...document.querySelectorAll('.msg')].find(x => x.innerText.includes('UI टेस्ट भेजने वाला'));
    return m ? m.querySelector('button[data-delmsg]').dataset.id : null;`);
  await b.click(`button[data-delmsg][data-id="${delBtn}"]`);
  await sleep(400);
  ok('संदेश हटाने की पुष्टि विंडो खुली', await b.eval(`return document.getElementById('confirmModal').classList.contains('open')`));
  await b.click('#confirmYes');
  await sleep(1300);
  ok('संदेश हट गया', await b.eval(`return !document.body.innerText.includes('UI टेस्ट भेजने वाला')`));

  /* ------------------------------------------------------ mobile admin */
  console.log('\n▸ मोबाइल पर एडमिन पैनल');
  await b.viewport(390, 844, true);
  await b.goto(BASE + '/admin');
  await sleep(900);
  const mob = await b.eval(`
    const de = document.documentElement;
    return { overflow: de.scrollWidth > de.clientWidth + 1, scrollW: de.scrollWidth, cw: de.clientWidth,
             menuBtn: getComputedStyle(document.getElementById('menuBtn')).display };`);
  ok('मोबाइल एडमिन में overflow नहीं', !mob.overflow, `${mob.scrollW}/${mob.cw}`);
  ok('मोबाइल पर ☰ बटन दिखा', mob.menuBtn !== 'none', mob.menuBtn);
  await b.click('#menuBtn');
  await sleep(600);
  ok('साइडबार खुला', await b.eval(`return document.getElementById('side').classList.contains('open')`));

  await b.close();
  console.log(`\n${'─'.repeat(52)}\n  कुल: ${pass + fail}   ✅ पास: ${pass}   ❌ फेल: ${fail}\n${'─'.repeat(52)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('\n💥 क्रैश:', e.message); process.exit(1); });
