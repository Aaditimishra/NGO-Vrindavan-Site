/**
 * Storage adapter — do mode me kaam karta hai:
 *
 *  1) LOCAL   (aapke computer / VPS par)  → data/content.json + public/uploads/
 *  2) VERCEL  (BLOB_READ_WRITE_TOKEN set) → Vercel Blob storage
 *
 * Vercel par filesystem read-only hota hai, isliye wahan content aur
 * uploaded images Blob me rakhe jaate hain taaki admin panel se kiya
 * gaya badlaav sach me save ho.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
let CONTENT_KEY, CONFIG_KEY;



let blobApi = null;
if (BLOB) blobApi = require('@vercel/blob');

/* --------------------------------------------------------- memory cache */
const cache = { content: null, contentAt: 0, config: null, configAt: 0 };
const TTL = 10000;                       // 10 sec — public pages ke liye

/* ------------------------------------------------------------ seed data */
function seedContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}

/* ------------------------------------------------------------ blob util */
/* Blob store public hota hai, aur website par lagi kisi bhi uploaded image ka URL
   store-id bata deta hai. Isliye content (jisme visitors ke sandesh hote hain) aur
   config (password hash) ek gupt folder me rakhte hain, jiska naam SESSION_SECRET se
   derive hota hai — yaani URL guess nahi kiya ja sakta.
   Path sthir rehta hai (random suffix nahi), taaki har baar theek ek hi blob rahe
   aur jaldi-jaldi hui writes me purana version na padha jaye.
   Uploaded images sadharan public path par rehti hain, kyunki unhe browser me dikhna hi hai. */
const SECRET_DIR = 'cms-' + crypto.createHash('sha256')
  .update(process.env.SESSION_SECRET || 'local-dev')
  .digest('hex').slice(0, 32);

CONTENT_KEY = `${SECRET_DIR}/state`;
CONFIG_KEY = `${SECRET_DIR}/config`;

/* Vercel Blob ka CDN ek hi URL ko kam se kam 60 second cache karta hai. Isliye ek
   sthir naam par overwrite karne se turant baad ka read purana data de deta hai —
   aur read-modify-write me naya sandesh purane ko mita deta hai.
   Samadhan: har write ek naye pathname par jaata hai jisme millisecond timestamp hai.
   Naya URL kabhi cache me hota hi nahi, isliye read hamesha sahi milta hai.
   Padhte waqt sabse bada timestamp chunte hain aur purani prati hata dete hain. */

const stamped = (base) => `${base}-${Date.now().toString(36).padStart(9, '0')}-${crypto.randomBytes(4).toString('hex')}.json`;
const stampOf = (pathname, base) => {
  const m = pathname.slice(base.length + 1).split('-')[0];
  const n = parseInt(m, 36);
  return Number.isFinite(n) ? n : 0;
};

async function blobRead(base) {
  const { list, del } = blobApi;
  const { blobs } = await list({ prefix: base + '-' });
  if (!blobs.length) return null;
  blobs.sort((a, b) => stampOf(b.pathname, base) - stampOf(a.pathname, base));
  const res = await fetch(blobs[0].url, { cache: 'no-store' });
  if (!res.ok) return null;
  let data;
  try { data = await res.json(); } catch (_) { return null; }
  // 3 se purani pratiyan hata do (halki safai, read ko rokti nahi)
  if (blobs.length > 3) {
    del(blobs.slice(3).map(b => b.url)).catch(() => {});
  }
  return data;
}

async function blobWrite(base, obj) {
  const { put } = blobApi;
  return put(stamped(base), JSON.stringify(obj, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0
  });
}

/* =========================================================== CONTENT == */

/** @param {boolean} fresh - true = cache ignore karke taaza data lao (admin ke liye) */
async function getContent(fresh = false) {
  if (!fresh && cache.content && Date.now() - cache.contentAt < TTL) return cache.content;

  let data;
  if (BLOB) {
    data = await blobRead(CONTENT_KEY);
    if (!data) {                                   // pehli baar — seed kar do
      data = seedContent();
      await blobWrite(CONTENT_KEY, data);
    }
  } else {
    data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  }
  if (!Array.isArray(data.messages)) data.messages = [];
  if (!Array.isArray(data.volunteers)) data.volunteers = [];
  cache.content = data;
  cache.contentAt = Date.now();
  return data;
}

async function setContent(data) {
  if (BLOB) {
    await blobWrite(CONTENT_KEY, data);
  } else {
    try {                                          // rolling backup
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (fs.existsSync(CONTENT_FILE)) fs.copyFileSync(CONTENT_FILE, path.join(BACKUP_DIR, `content-${stamp}.json`));
      const old = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort();
      while (old.length > 20) fs.unlinkSync(path.join(BACKUP_DIR, old.shift()));
    } catch (_) {}
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
  }
  cache.content = data;
  cache.contentAt = Date.now();
}

/* ============================================================ CONFIG == */

/** Pehli baar chalne par admin banata hai.
 *  ADMIN_PASSWORD set ho to wahi, warna ek random password bana kar console par dikha deta hai.
 *  (Repo public hai, isliye code me koi fixed password nahi rakha gaya.) */
function defaultConfig() {
  const bcrypt = require('bcryptjs');
  const plain = process.env.ADMIN_PASSWORD || crypto.randomBytes(6).toString('base64url');
  return {
    username: process.env.ADMIN_USER || 'admin',
    passwordHash: bcrypt.hashSync(plain, 10),
    sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(24).toString('hex'),
    _plainOnce: process.env.ADMIN_PASSWORD ? null : plain
  };
}

async function getConfig(fresh = false) {
  if (!fresh && cache.config && Date.now() - cache.configAt < TTL) return cache.config;

  let cfg;
  if (BLOB) {
    cfg = await blobRead(CONFIG_KEY);
    if (!cfg) { cfg = defaultConfig(); delete cfg._plainOnce; await blobWrite(CONFIG_KEY, cfg); }
  } else {
    if (!fs.existsSync(CONFIG_FILE)) {
      cfg = defaultConfig();
      const shown = cfg._plainOnce; delete cfg._plainOnce;
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
      console.log(`\n  🔑  Admin banaya gaya  →  username: ${cfg.username}`);
      console.log(`      password: ${shown || '(ADMIN_PASSWORD env se liya gaya)'}`);
      console.log('      Ye password ab dobara nahi dikhega. Login ke baad ⚙️ सेटिंग्स से badal lein.\n');
    } else {
      cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  }
  // SESSION_SECRET env hamesha jeeta hai — taaki deploy par sabhi instance ek jaisa sign karein
  if (process.env.SESSION_SECRET) cfg.sessionSecret = process.env.SESSION_SECRET;
  cache.config = cfg;
  cache.configAt = Date.now();
  return cfg;
}

async function setConfig(cfg) {
  if (BLOB) await blobWrite(CONFIG_KEY, cfg);
  else fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  cache.config = cfg;
  cache.configAt = Date.now();
}

/* =========================================================== UPLOADS == */

async function saveUpload(buffer, originalName, mimetype) {
  const ext = (path.extname(originalName) || '.jpg').toLowerCase();
  const base = path.basename(originalName, ext).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40) || 'img';
  const name = `${base}-${Date.now().toString(36)}${ext}`;

  if (BLOB) {
    const { put } = blobApi;
    const res = await put(`uploads/${name}`, buffer, {
      access: 'public', contentType: mimetype, addRandomSuffix: false, allowOverwrite: true
    });
    return res.url;                                   // poora https URL
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

async function listUploads() {
  if (BLOB) {
    const { list } = blobApi;
    const { blobs } = await list({ prefix: 'uploads/', limit: 200 });
    return blobs
      .map(b => ({ url: b.url, mtime: new Date(b.uploadedAt).getTime() }))
      .sort((a, b) => b.mtime - a.mtime);
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  return fs.readdirSync(UPLOAD_DIR)
    .filter(f => /\.(jpe?g|png|webp|gif|svg)$/i.test(f))
    .map(f => ({ url: `/uploads/${f}`, mtime: fs.statSync(path.join(UPLOAD_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
}

module.exports = { getContent, setContent, getConfig, setConfig, saveUpload, listUploads, isBlob: BLOB };
