/**
 * Vardan Shri Golok Dham Seva Trust
 * Website + CMS  —  Express + EJS
 *
 * Storage lib/store.js sambhalta hai:
 *   local  → data/content.json + public/uploads/
 *   Vercel → Vercel Blob (kyunki serverless par filesystem read-only hai)
 */
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const store = require('./lib/store');

const app = express();
const PORT = process.env.PORT || 3400;
const COOKIE = 'gd_admin';
const MAX_AGE = 1000 * 60 * 60 * 8;                     // 8 ghante

/* ============================================================ helpers == */

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token, secret) {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const expect = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (_) { return null; }
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

function sanitize(v, max = 2000) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

/* ========================================================== app setup == */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: process.env.NO_CACHE ? 0 : '1h' }));
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

const MONTHS = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];

// har page ko content milta hai
app.use(wrap(async (req, res, next) => {
  const adminArea = req.path.startsWith('/admin');
  res.locals.c = await store.getContent(adminArea);      // admin ko hamesha taaza data
  res.locals.path = req.path;
  res.locals.formatDate = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };
  next();
}));

/* ======================================================= public routes == */

const page = (view, title, cls = 'inner') => (req, res) =>
  res.render(view, { pageTitle: title, bodyClass: cls });

app.get('/', page('index', 'मुख्य पृष्ठ', 'home'));
app.get('/about', page('about', 'हमारे बारे में'));
app.get('/seva', page('seva', 'हमारी सेवाएँ'));
app.get('/gallery', page('gallery', 'गैलरी'));
app.get('/events', page('events', 'उत्सव एवं कार्यक्रम'));
app.get('/donate', page('donate', 'दान करें'));
app.get('/volunteer', page('volunteer', 'स्वयंसेवक बनें'));
app.get('/contact', page('contact', 'संपर्क करें'));
app.get('/blog', page('blog', 'समाचार एवं ब्लॉग'));

app.get('/blog/:slug', (req, res) => {
  const post = (res.locals.c.blog.posts || []).find(p => p.slug === req.params.slug);
  if (!post) return res.status(404).render('404', { pageTitle: 'नहीं मिला', bodyClass: 'inner' });
  res.render('blog-post', { pageTitle: post.title, post, bodyClass: 'inner' });
});

app.get('/robots.txt', (req, res) =>
  res.type('text/plain').send('User-agent: *\nDisallow: /admin\nAllow: /\n'));

/* ==================================================== form submission == */

app.post('/api/contact', wrap(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!sanitize(name) || !sanitize(message)) {
    return res.status(400).json({ ok: false, error: 'नाम और संदेश आवश्यक है।' });
  }
  const data = await store.getContent(true);
  data.messages.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: 'contact',
    name: sanitize(name, 120), email: sanitize(email, 160), phone: sanitize(phone, 30),
    subject: sanitize(subject, 200), message: sanitize(message, 4000),
    read: false, at: new Date().toISOString()
  });
  data.messages = data.messages.slice(0, 1000);
  try {
    await store.setContent(data);
  } catch (e) {
    if (e.message === 'STORAGE_DOWN') {
      return res.status(503).json({ ok: false,
        error: 'क्षमा करें, इस समय संदेश सहेजा नहीं जा सका। कृपया सीधे फोन अथवा व्हाट्सएप पर संपर्क करें।' });
    }
    throw e;
  }
  res.json({ ok: true, message: 'धन्यवाद! आपका संदेश प्राप्त हो गया है। हम शीघ्र संपर्क करेंगे।' });
}));

app.post('/api/volunteer', wrap(async (req, res) => {
  const { name, email, phone, city, role, availability, message } = req.body;
  if (!sanitize(name) || !sanitize(phone)) {
    return res.status(400).json({ ok: false, error: 'नाम और मोबाइल नंबर आवश्यक है।' });
  }
  const data = await store.getContent(true);
  data.volunteers.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: sanitize(name, 120), email: sanitize(email, 160), phone: sanitize(phone, 30),
    city: sanitize(city, 120), role: sanitize(role, 160), availability: sanitize(availability, 160),
    message: sanitize(message, 3000), read: false, at: new Date().toISOString()
  });
  data.volunteers = data.volunteers.slice(0, 1000);
  try {
    await store.setContent(data);
  } catch (e) {
    if (e.message === 'STORAGE_DOWN') {
      return res.status(503).json({ ok: false,
        error: 'क्षमा करें, इस समय संदेश सहेजा नहीं जा सका। कृपया सीधे फोन अथवा व्हाट्सएप पर संपर्क करें।' });
    }
    throw e;
  }
  res.json({ ok: true, message: 'राधे राधे! आपका पंजीकरण हो गया है। हमारी टीम शीघ्र संपर्क करेगी।' });
}));

/* =========================================================== admin auth */

const requireAuth = wrap(async (req, res, next) => {
  const cfg = await store.getConfig();
  const session = verify(readCookie(req, COOKIE), cfg.sessionSecret);
  if (session && session.u === cfg.username) { req.admin = session.u; return next(); }
  if (req.path.startsWith('/admin/api/')) return res.status(401).json({ ok: false, error: 'लॉगिन आवश्यक है' });
  return res.redirect('/admin/login');
});

app.get('/admin/login', wrap(async (req, res) => {
  const cfg = await store.getConfig();
  if (verify(readCookie(req, COOKIE), cfg.sessionSecret)) return res.redirect('/admin');
  res.render('admin/login', { error: null });
}));

app.post('/admin/login', wrap(async (req, res) => {
  const { username, password } = req.body;
  const cfg = await store.getConfig(true);
  const okUser = String(username || '') === cfg.username;
  const okPass = bcrypt.compareSync(String(password || ''), cfg.passwordHash);
  if (!okUser || !okPass) {
    return res.status(401).render('admin/login', { error: 'गलत यूज़रनेम या पासवर्ड' });
  }
  const token = sign({ u: cfg.username, exp: Date.now() + MAX_AGE }, cfg.sessionSecret);
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production' || !!process.env.VERCEL
  });
  res.redirect('/admin');
}));

app.get('/admin/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.redirect('/admin/login');
});

app.get('/admin', requireAuth, (req, res) => res.render('admin/dashboard', { user: req.admin }));

/* ============================================================ admin api */

const STORAGE_MSG = 'भंडारण (storage) इस समय उपलब्ध नहीं है, इसलिए बदलाव सहेजे नहीं जा सकते। ' +
  'वेबसाइट सामान्य रूप से चल रही है। कृपया Vercel में Blob store की billing सक्रिय करें।';

app.get('/admin/api/content', requireAuth, wrap(async (req, res) => {
  const data = await store.getContent(true);
  res.set('X-Storage-Ok', store.health.ok ? '1' : '0');
  if (!store.health.ok) res.set('X-Storage-Error', encodeURIComponent(STORAGE_MSG));
  res.json(data);
}));

app.put('/admin/api/content', requireAuth, wrap(async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ ok: false, error: 'गलत डेटा' });
  }
  const current = await store.getContent(true);
  // messages / volunteers sirf apne endpoints se badalte hain
  const merged = { ...current, ...incoming, messages: current.messages, volunteers: current.volunteers };
  try {
    await store.setContent(merged);
  } catch (e) {
    if (e.message === 'STORAGE_DOWN') return res.status(503).json({ ok: false, error: STORAGE_MSG });
    throw e;
  }
  res.json({ ok: true, message: 'सफलतापूर्वक सहेजा गया' });
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype);
    cb(ok ? null : new Error('केवल इमेज फाइल अपलोड करें (jpg, png, webp, gif, svg)'), ok);
  }
});

app.post('/admin/api/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ ok: false, error: err.message });
    if (!req.file) return res.status(400).json({ ok: false, error: 'कोई फाइल नहीं मिली' });
    try {
      const url = await store.saveUpload(req.file.buffer, req.file.originalname, req.file.mimetype);
      res.json({ ok: true, url });
    } catch (e) {
      if (e.message === 'STORAGE_DOWN') return res.status(503).json({ ok: false, error: STORAGE_MSG });
      res.status(500).json({ ok: false, error: 'अपलोड विफल: ' + e.message });
    }
  });
});

app.get('/admin/api/uploads', requireAuth, wrap(async (req, res) =>
  res.json(await store.listUploads())));

app.patch('/admin/api/inbox/:kind/:id', requireAuth, wrap(async (req, res) => {
  const key = req.params.kind === 'volunteers' ? 'volunteers' : 'messages';
  const data = await store.getContent(true);
  const item = data[key].find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'नहीं मिला' });
  item.read = req.body.read !== false;
  await store.setContent(data);
  res.json({ ok: true });
}));

app.delete('/admin/api/inbox/:kind/:id', requireAuth, wrap(async (req, res) => {
  const key = req.params.kind === 'volunteers' ? 'volunteers' : 'messages';
  const data = await store.getContent(true);
  const before = data[key].length;
  data[key] = data[key].filter(m => m.id !== req.params.id);
  if (data[key].length === before) return res.status(404).json({ ok: false, error: 'नहीं मिला' });
  await store.setContent(data);
  res.json({ ok: true });
}));

app.post('/admin/api/password', requireAuth, wrap(async (req, res) => {
  const { current, next: nextPw } = req.body;
  const cfg = await store.getConfig(true);
  if (!bcrypt.compareSync(String(current || ''), cfg.passwordHash)) {
    return res.status(400).json({ ok: false, error: 'वर्तमान पासवर्ड गलत है' });
  }
  if (String(nextPw || '').length < 6) {
    return res.status(400).json({ ok: false, error: 'नया पासवर्ड कम से कम 6 अक्षर का हो' });
  }
  cfg.passwordHash = bcrypt.hashSync(String(nextPw), 10);
  try {
    await store.setConfig(cfg);
  } catch (e) {
    if (e.message === 'STORAGE_DOWN') return res.status(503).json({ ok: false, error: STORAGE_MSG });
    throw e;
  }
  res.json({ ok: true, message: 'पासवर्ड बदल दिया गया' });
}));

/* ================================================================ misc */

app.use(wrap(async (req, res) =>
  res.status(404).render('404', { pageTitle: 'पृष्ठ नहीं मिला', bodyClass: 'inner' })));

app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (req.path.startsWith('/admin/api/') || req.path.startsWith('/api/')) {
    return res.status(500).json({ ok: false, error: 'सर्वर त्रुटि' });
  }
  res.status(500).send('Server error');
});

/* Vercel par ye file module ke roop me use hoti hai, local par server chalti hai */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  🪷  Vardan Shri Golok Dham Seva Trust`);
    console.log(`      Website : http://localhost:${PORT}`);
    console.log(`      Admin   : http://localhost:${PORT}/admin`);
    console.log(`      Storage : ${store.isBlob ? 'Vercel Blob' : 'local files (data/)'}\n`);
  });
}

module.exports = app;
