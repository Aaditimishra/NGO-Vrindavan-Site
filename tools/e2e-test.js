/**
 * End-to-end test — poori website + CMS.
 * Chalane se pehle server chalu hona chahiye:  npm start
 * Phir:  node tools/e2e-test.js
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:3400';
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASS;
if (!PASS) {
  console.error('\n  ADMIN_PASS zaroori hai. Chalayein:  ADMIN_PASS=<aapka-password> node ' + process.argv[1].split('/').pop() + '\n');
  process.exit(1);
}
const SNAPSHOT = path.join(__dirname, '..', 'data', '.e2e-snapshot.json');

let cookie = '';
let pass = 0, fail = 0;
const results = [];

function ok(name, cond, extra = '') {
  if (cond) { pass++; results.push(`  ✅ ${name}`); }
  else { fail++; results.push(`  ❌ ${name}${extra ? ' → ' + extra : ''}`); }
}
function group(t) { results.push(`\n▸ ${t}`); }

async function req(p, opts = {}) {
  const headers = Object.assign({}, opts.headers || {});
  if (cookie) headers.Cookie = cookie;
  if (opts.json) { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(opts.json); }
  const res = await fetch(BASE + p, { ...opts, headers, redirect: 'manual' });
  const sc = res.headers.get('set-cookie');
  if (sc) cookie = sc.split(';')[0];
  return res;
}
const getJSON = async (p) => (await req(p)).json();
const getText = async (p) => (await req(p)).text();
const content = () => getJSON('/admin/api/content');
const save = (data) => req('/admin/api/content', { method: 'PUT', json: data });

(async function run() {
  /* ---------------------------------------------------- 1. public pages */
  group('सार्वजनिक पृष्ठ');
  const pages = ['/', '/about', '/seva', '/gallery', '/events', '/donate', '/volunteer', '/contact', '/blog'];
  for (const p of pages) {
    const r = await req(p);
    ok(`GET ${p}`, r.status === 200, `status ${r.status}`);
  }
  ok('GET /nope → 404', (await req('/nope')).status === 404);

  /* -------------------------------------------------------- 2. auth */
  group('लॉगिन सुरक्षा');
  ok('बिना लॉगिन admin API → 401', (await req('/admin/api/content')).status === 401);
  ok('बिना लॉगिन /admin → redirect', (await req('/admin')).status === 302);
  const bad = await req('/admin/login', { method: 'POST', body: new URLSearchParams({ username: USER, password: 'galat' }) });
  ok('गलत पासवर्ड अस्वीकृत', bad.status === 401);
  cookie = '';
  const good = await req('/admin/login', { method: 'POST', body: new URLSearchParams({ username: USER, password: PASS }) });
  ok('सही पासवर्ड से लॉगिन', good.status === 302 && !!cookie);
  ok('लॉगिन के बाद /admin खुला', (await req('/admin')).status === 200);

  /* ------------------------------------------------ snapshot for restore */
  const original = await content();
  fs.writeFileSync(SNAPSHOT, JSON.stringify(original, null, 2));

  /* -------------------------------------------- 3. gallery add + delete */
  group('गैलरी — चित्र जोड़ना व हटाना');
  let c = await content();
  const galBefore = c.gallery.images.length;
  c.gallery.images.push({ src: '/img/g1.svg', caption: 'E2E टेस्ट चित्र', category: 'अन्नदान' });
  ok('गैलरी में चित्र जोड़ा गया (save)', (await save(c)).status === 200);
  c = await content();
  ok('जुड़ा हुआ चित्र सेव हुआ', c.gallery.images.length === galBefore + 1);
  ok('चित्र गैलरी पेज पर दिख रहा है', (await getText('/gallery')).includes('E2E टेस्ट चित्र'));

  const idx = c.gallery.images.findIndex(g => g.caption === 'E2E टेस्ट चित्र');
  c.gallery.images.splice(idx, 1);                       // वही जो 🗑 बटन करता है
  await save(c);
  c = await content();
  ok('चित्र हट गया (डेटा)', c.gallery.images.length === galBefore);
  ok('चित्र गैलरी पेज से हटा', !(await getText('/gallery')).includes('E2E टेस्ट चित्र'));

  /* ------------------------------------------ 4. gallery category (tags) */
  group('गैलरी — श्रेणी जोड़ना व हटाना');
  const catBefore = c.gallery.categories.length;
  c.gallery.categories.push('E2E श्रेणी');
  await save(c); c = await content();
  ok('नई श्रेणी जुड़ी', c.gallery.categories.includes('E2E श्रेणी'));
  ok('श्रेणी बटन पेज पर आया', (await getText('/gallery')).includes('E2E श्रेणी'));
  c.gallery.categories = c.gallery.categories.filter(x => x !== 'E2E श्रेणी');
  await save(c); c = await content();
  ok('श्रेणी हट गई', c.gallery.categories.length === catBefore);

  /* --------------------------------------------- 5. seva item add/delete */
  group('सेवाएँ — जोड़ना, क्रम बदलना, हटाना');
  const sevaBefore = c.seva.items.length;
  c.seva.items.push({ icon: 'lotus', title: 'E2E सेवा', short: 'टेस्ट', text: 'टेस्ट विवरण', image: '/img/seva-food.svg' });
  await save(c); c = await content();
  ok('सेवा जुड़ी', c.seva.items.some(s => s.title === 'E2E सेवा'));
  ok('सेवा पेज पर दिखी', (await getText('/seva')).includes('E2E सेवा'));
  // क्रम बदलना (↑ बटन)
  const last = c.seva.items.length - 1;
  [c.seva.items[last], c.seva.items[last - 1]] = [c.seva.items[last - 1], c.seva.items[last]];
  await save(c); c = await content();
  ok('क्रम बदला (↑ बटन)', c.seva.items[last - 1].title === 'E2E सेवा');
  c.seva.items = c.seva.items.filter(s => s.title !== 'E2E सेवा');
  await save(c); c = await content();
  ok('सेवा हट गई', c.seva.items.length === sevaBefore);
  ok('सेवा पेज से हटी', !(await getText('/seva')).includes('E2E सेवा'));

  /* --------------------------------------------- 6. blog post add/delete */
  group('ब्लॉग — लेख जोड़ना व हटाना');
  c.blog.posts.unshift({
    slug: 'e2e-test-post', title: 'E2E टेस्ट लेख', date: '2026-09-08', author: 'टेस्ट',
    image: '/img/blog-1.svg', excerpt: 'टेस्ट सार', content: 'पहला पैराग्राफ।\n\nदूसरा पैराग्राफ।'
  });
  await save(c);
  ok('लेख सूची में आया', (await getText('/blog')).includes('E2E टेस्ट लेख'));
  const postRes = await req('/blog/e2e-test-post');
  ok('लेख का अपना पेज खुला', postRes.status === 200);
  ok('लेख के दोनों पैराग्राफ बने', (await getText('/blog/e2e-test-post')).includes('दूसरा पैराग्राफ'));
  c = await content();
  c.blog.posts = c.blog.posts.filter(p => p.slug !== 'e2e-test-post');
  await save(c);
  ok('लेख हटने पर पेज 404', (await req('/blog/e2e-test-post')).status === 404);
  ok('लेख सूची से हटा', !(await getText('/blog')).includes('E2E टेस्ट लेख'));

  /* -------------------------------------------------- 7. events add/del */
  group('उत्सव — कार्यक्रम जोड़ना व हटाना');
  c = await content();
  const evBefore = c.events.upcoming.length;
  c.events.upcoming.push({ date: '2026-12-31', title: 'E2E कार्यक्रम', time: 'प्रातः 9', venue: 'वृन्दावन', text: 'टेस्ट', image: '/img/event-1.svg' });
  await save(c);
  ok('कार्यक्रम जुड़ा व पेज पर दिखा', (await getText('/events')).includes('E2E कार्यक्रम'));
  c = await content();
  c.events.upcoming = c.events.upcoming.filter(e => e.title !== 'E2E कार्यक्रम');
  await save(c); c = await content();
  ok('कार्यक्रम हट गया', c.events.upcoming.length === evBefore);
  ok('कार्यक्रम पेज से हटा', !(await getText('/events')).includes('E2E कार्यक्रम'));

  /* ------------------------------------------- 8. contact form → inbox */
  group('संपर्क फॉर्म → संदेश → पढ़ा → हटाया');
  const msgBefore = (await content()).messages.length;
  const cf = await (await req('/api/contact', { method: 'POST', json: {
    name: 'E2E दानदाता', phone: '+919999000011', email: 'e2e@test.com', subject: 'दान', message: 'यह एक टेस्ट संदेश है।'
  }})).json();
  ok('फॉर्म सफलतापूर्वक जमा हुआ', cf.ok === true);
  let inbox = (await content()).messages;
  ok('संदेश इनबॉक्स में आया', inbox.length === msgBefore + 1 && inbox[0].name === 'E2E दानदाता');
  ok('नया संदेश अपठित है', inbox[0].read === false);
  const mid = inbox[0].id;
  ok('पढ़ा हुआ चिह्नित हुआ', (await req(`/admin/api/inbox/messages/${mid}`, { method: 'PATCH', json: { read: true } })).status === 200);
  ok('read=true सेव हुआ', (await content()).messages.find(m => m.id === mid).read === true);
  ok('संदेश हटाया गया', (await req(`/admin/api/inbox/messages/${mid}`, { method: 'DELETE' })).status === 200);
  ok('संदेश इनबॉक्स से गायब', (await content()).messages.length === msgBefore);
  const badForm = await req('/api/contact', { method: 'POST', json: { name: '', message: '' } });
  ok('खाली फॉर्म अस्वीकृत (400)', badForm.status === 400);

  /* --------------------------------------- 9. volunteer form → आवेदन */
  group('स्वयंसेवक फॉर्म → आवेदन → हटाया');
  const volBefore = (await content()).volunteers.length;
  const vf = await (await req('/api/volunteer', { method: 'POST', json: {
    name: 'E2E स्वयंसेवक', phone: '+918888000022', city: 'वृन्दावन', role: 'गौ सेवा', availability: 'प्रतिदिन', message: 'टेस्ट'
  }})).json();
  ok('आवेदन जमा हुआ', vf.ok === true);
  let vols = (await content()).volunteers;
  ok('आवेदन सूची में आया', vols.length === volBefore + 1 && vols[0].name === 'E2E स्वयंसेवक');
  const vid = vols[0].id;
  await req(`/admin/api/inbox/volunteers/${vid}`, { method: 'PATCH', json: { read: true } });
  ok('आवेदन पढ़ा हुआ हुआ', (await content()).volunteers.find(v => v.id === vid).read === true);
  await req(`/admin/api/inbox/volunteers/${vid}`, { method: 'DELETE' });
  ok('आवेदन हटा', (await content()).volunteers.length === volBefore);
  ok('बिना फोन आवेदन अस्वीकृत', (await req('/api/volunteer', { method: 'POST', json: { name: 'x' } })).status === 400);

  /* --------------------------------------------- 10. contact details edit */
  group('संपर्क विवरण बदलना (पूरी साइट पर असर)');
  c = await content();
  const origPhone = c.contact.phone, origAddr = c.contact.addressLine1;
  c.contact.phone = '+91 77777 88888';
  c.contact.addressLine1 = 'E2E टेस्ट पता';
  await save(c);
  const home = await getText('/'), contactPg = await getText('/contact');
  ok('नया फोन हेडर/फुटर में दिखा', home.includes('+91 77777 88888'));
  ok('नया फोन संपर्क पेज पर दिखा', contactPg.includes('+91 77777 88888'));
  ok('नया पता फुटर में दिखा', home.includes('E2E टेस्ट पता'));
  c = await content(); c.contact.phone = origPhone; c.contact.addressLine1 = origAddr;
  await save(c);
  ok('संपर्क विवरण वापस पुराना हुआ', (await getText('/')).includes(origPhone));

  /* ------------------------------------------------------ 11. उपलोड */
  group('चित्र अपलोड');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#E2701E"/></svg>';
  const fd = new FormData();
  fd.append('file', new Blob([svg], { type: 'image/svg+xml' }), 'e2e-test.svg');
  const up = await (await req('/admin/api/upload', { method: 'POST', body: fd })).json();
  ok('चित्र अपलोड हुआ', up.ok === true && up.url.startsWith('/uploads/'), JSON.stringify(up));
  if (up.url) {
    ok('अपलोड किया चित्र खुल रहा है', (await req(up.url)).status === 200);
    ok('लाइब्रेरी सूची में आया', (await getJSON('/admin/api/uploads')).some(f => f.url === up.url));
    // content me use karke verify
    c = await content();
    const oldLogo = c.site.logo;
    c.site.logo = up.url; await save(c);
    ok('अपलोड चित्र साइट पर लगा', (await getText('/')).includes(up.url));
    c = await content(); c.site.logo = oldLogo; await save(c);
    try { fs.unlinkSync(path.join(__dirname, '..', 'public', up.url)); } catch (_) {}
  }
  const badUp = new FormData();
  badUp.append('file', new Blob(['hello'], { type: 'text/plain' }), 'bad.txt');
  ok('गैर-इमेज फाइल अस्वीकृत', (await req('/admin/api/upload', { method: 'POST', body: badUp })).status === 400);

  /* ------------------------------------- 12. messages save ke baad bache */
  group('डेटा सुरक्षा');
  await req('/api/contact', { method: 'POST', json: { name: 'सुरक्षा जाँच', message: 'टेस्ट' } });
  c = await content();
  const keepId = c.messages[0].id;
  c.home.welcomeHeading = c.home.welcomeHeading;           // बिना messages भेजे save
  delete c.messages;
  await save(c);
  const after = await content();
  ok('कंटेंट सेव करने पर संदेश नहीं मिटे', after.messages.some(m => m.id === keepId));
  await req(`/admin/api/inbox/messages/${keepId}`, { method: 'DELETE' });
  ok('बैकअप फाइलें बन रही हैं', fs.readdirSync(path.join(__dirname, '..', 'data', 'backups')).length > 0);

  /* -------------------------------------------------- 13. password flow */
  group('पासवर्ड बदलना');
  const wrongPw = await (await req('/admin/api/password', { method: 'POST', json: { current: 'galat', next: 'newpass123' } })).json();
  ok('गलत वर्तमान पासवर्ड अस्वीकृत', wrongPw.ok === false);
  const shortPw = await (await req('/admin/api/password', { method: 'POST', json: { current: PASS, next: '123' } })).json();
  ok('छोटा पासवर्ड अस्वीकृत', shortPw.ok === false);
  const chg = await (await req('/admin/api/password', { method: 'POST', json: { current: PASS, next: 'e2eTemp123' } })).json();
  ok('पासवर्ड बदला', chg.ok === true);
  cookie = '';
  const relog = await req('/admin/login', { method: 'POST', body: new URLSearchParams({ username: USER, password: 'e2eTemp123' }) });
  ok('नए पासवर्ड से लॉगिन हुआ', relog.status === 302);
  await req('/admin/api/password', { method: 'POST', json: { current: 'e2eTemp123', next: PASS } });
  cookie = '';
  ok('पासवर्ड वापस पुराना हुआ',
    (await req('/admin/login', { method: 'POST', body: new URLSearchParams({ username: USER, password: PASS }) })).status === 302);

  /* ---------------------------------------------------- 14. logout */
  group('लॉगआउट');
  await req('/admin/logout');
  ok('लॉगआउट के बाद admin बंद', (await req('/admin')).status === 302);

  /* ------------------------------------------------------- restore */
  cookie = '';
  await req('/admin/login', { method: 'POST', body: new URLSearchParams({ username: USER, password: PASS }) });
  const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  await save(snap);
  fs.unlinkSync(SNAPSHOT);
  const restored = await content();
  ok('मूल कंटेंट पूरी तरह वापस',
    restored.gallery.images.length === original.gallery.images.length &&
    restored.seva.items.length === original.seva.items.length &&
    restored.contact.phone === original.contact.phone);

  console.log(results.join('\n'));
  console.log(`\n${'─'.repeat(52)}\n  कुल: ${pass + fail}   ✅ पास: ${pass}   ❌ फेल: ${fail}\n${'─'.repeat(52)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('\n💥 टेस्ट क्रैश:', e); process.exit(1); });
