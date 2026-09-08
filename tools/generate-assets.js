/**
 * Decorative SVG asset generator.
 * Chalane ka tareeka:  node tools/generate-assets.js
 * Ye sundar placeholder images banata hai. Admin panel se asli photo upload karke inhe badla ja sakta hai.
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'img');
fs.mkdirSync(OUT, { recursive: true });

const write = (name, svg) => fs.writeFileSync(path.join(OUT, name), svg.trim() + '\n');

/* ------------------------------------------------------------ motifs */
const MOTIF = {
  lotus: `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M100 132c0 0-34-6-46-26 14-10 34-6 46 10 12-16 32-20 46-10-12 20-46 26-46 26z"/>
    <path d="M100 132c-16 0-30-20-30-44 0-22 14-42 30-52 16 10 30 30 30 52 0 24-14 44-30 44z"/>
    <path d="M100 132c-24 4-52-8-64-28M100 132c24 4 52-8 64-28"/>
    <path d="M60 140h80" stroke-width="2.4"/></g>`,
  om: `<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M74 96c-14 0-24 10-24 24s10 24 26 24c18 0 26-14 26-30 0-10-4-18-12-22"/>
    <path d="M102 114c8-10 22-12 32-4 12 10 8 30-8 34-10 2-18-4-20-12"/>
    <path d="M104 76c8-8 20-8 28-2M138 62c6-2 12 2 12 8"/>
    <circle cx="146" cy="46" r="4" fill="currentColor" stroke="none"/></g>`,
  flute: `<g fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round">
    <path d="M44 138 L156 66"/><path d="M48 144 L160 72"/>
    <circle cx="74" cy="122" r="3.2" fill="currentColor"/><circle cx="92" cy="110" r="3.2" fill="currentColor"/>
    <circle cx="110" cy="99" r="3.2" fill="currentColor"/><circle cx="128" cy="88" r="3.2" fill="currentColor"/>
    <path d="M150 60c8-8 18-10 26-4" stroke-width="2.6"/></g>`,
  cow: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M56 96c0-18 20-30 44-30s44 12 44 30c0 26-18 44-44 44S56 122 56 96z"/>
    <path d="M56 92c-12-14-16-30-10-40 12 0 22 10 26 22M144 92c12-14 16-30 10-40-12 0-22 10-26 22"/>
    <circle cx="84" cy="98" r="4" fill="currentColor"/><circle cx="116" cy="98" r="4" fill="currentColor"/>
    <path d="M86 120c8 6 20 6 28 0"/><path d="M74 148v18M126 148v18"/></g>`,
  food: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M42 120h116c0 22-26 34-58 34s-58-12-58-34z"/><path d="M34 120h132"/>
    <path d="M100 66c-10 8-14 18-8 26 4 6 4 12 0 16"/>
    <path d="M76 78c-6 6-8 14-4 20M124 78c6 6 8 14 4 20" stroke-width="2.6"/></g>`,
  book: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M100 76c-14-12-34-16-52-14v76c18-2 38 2 52 14 14-12 34-16 52-14V62c-18-2-38 2-52 14z"/>
    <path d="M100 76v76"/><path d="M64 88h22M64 104h22M114 88h22M114 104h22" stroke-width="2.4"/></g>`,
  health: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M100 150s-46-26-46-58c0-18 14-30 30-30 8 0 14 4 16 10 2-6 8-10 16-10 16 0 30 12 30 30 0 32-46 58-46 58z"/>
    <path d="M84 96h32M100 80v32" stroke-width="3"/></g>`,
  cloth: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M72 62l28 14 28-14 26 20-16 20-10-6v56H72V96l-10 6-16-20z"/>
    <path d="M84 122h32" stroke-width="2.4"/></g>`,
  home: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M46 104L100 58l54 46"/><path d="M60 100v52h80v-52"/>
    <path d="M88 152v-30h24v30"/><path d="M100 40v10" stroke-width="2.6"/></g>`,
  family: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="76" cy="82" r="16"/><circle cx="126" cy="88" r="13"/>
    <path d="M48 148c0-18 12-30 28-30s28 12 28 30"/><path d="M106 148c0-14 8-24 20-24s20 10 20 24"/></g>`,
  diya: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M52 118h96c0 20-22 30-48 30s-48-10-48-30z"/>
    <path d="M100 106c8-8 10-18 4-26-2-4-2-8 2-12-14 4-22 16-18 28 1 4 5 8 12 10z" fill="currentColor" stroke="none"/>
    <path d="M100 108c-6-6-8-14-4-20" /></g>`,
  peacock: `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M100 158c0-40 8-70 22-88 10-12 22-18 30-16 4 10-2 24-12 34"/>
    <ellipse cx="140" cy="52" rx="16" ry="22" transform="rotate(28 140 52)"/>
    <ellipse cx="140" cy="52" rx="7" ry="10" transform="rotate(28 140 52)"/>
    <path d="M100 158c0-30-6-54-16-68M100 158c2-34 12-58 26-72" stroke-width="2.2"/></g>`,
  hands: `<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M62 150c-8-16-10-34-4-48 4-10 12-14 18-10 4 2 6 8 6 14"/>
    <path d="M138 150c8-16 10-34 4-48-4-10-12-14-18-10-4 2-6 8-6 14"/>
    <path d="M82 106V72c0-8 4-12 9-12s9 4 9 12v34M100 106V66c0-8 4-12 9-12s9 4 9 12v40"/>
    <path d="M62 150h76" stroke-width="2.4"/></g>`
};

/* --------------------------------------------------- mandala pattern */
function mandala(color = '#F5B841', op = 1) {
  let petals = '';
  for (let i = 0; i < 16; i++) {
    const a = (i * 360) / 16;
    petals += `<path d="M200 200 C 214 150, 214 110, 200 62 C 186 110, 186 150, 200 200 Z" transform="rotate(${a} 200 200)"/>`;
  }
  let petals2 = '';
  for (let i = 0; i < 24; i++) {
    const a = (i * 360) / 24;
    petals2 += `<path d="M200 200 C 208 172, 208 152, 200 130 C 192 152, 192 172, 200 200 Z" transform="rotate(${a} 200 200)"/>`;
  }
  let dots = '';
  for (let i = 0; i < 32; i++) {
    const a = ((i * 360) / 32) * Math.PI / 180;
    dots += `<circle cx="${(200 + 176 * Math.cos(a)).toFixed(1)}" cy="${(200 + 176 * Math.sin(a)).toFixed(1)}" r="3"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="${color}" stroke-width="1.4" opacity="${op}">
    <circle cx="200" cy="200" r="192"/><circle cx="200" cy="200" r="168"/>
    <circle cx="200" cy="200" r="120"/><circle cx="200" cy="200" r="58"/><circle cx="200" cy="200" r="26"/>
    ${petals}${petals2}
    <g fill="${color}" stroke="none">${dots}</g>
  </g></svg>`;
}

function lotusPattern(color = '#E8CE8F') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <g fill="none" stroke="${color}" stroke-width="1.5" opacity=".9">
    <path d="M120 168c0 0-40-8-54-32 16-12 40-8 54 12 14-20 38-24 54-12-14 24-54 32-54 32z"/>
    <path d="M120 168c-18 0-34-24-34-52 0-26 16-48 34-60 18 12 34 34 34 60 0 28-16 52-34 52z"/>
    <circle cx="120" cy="120" r="106" stroke-dasharray="4 9"/>
    <path d="M20 200h200" stroke-dasharray="3 8"/>
  </g></svg>`;
}

/* ------------------------------------------------------ image maker */
const PALETTES = {
  saffron:  ['#FFE7BC', '#F2A94B', '#D9701C'],
  gold:     ['#FFF3D4', '#EFC96B', '#B98C2E'],
  teal:     ['#CFEDE9', '#3FA39C', '#0B4F4C'],
  indigo:   ['#DDD0EC', '#7B57A3', '#2B1B47'],
  rose:     ['#FBDCE6', '#D7799B', '#8E2F55'],
  sage:     ['#DCEBCF', '#7FA85C', '#3D5F2A'],
  copper:   ['#FCE0CE', '#DE9366', '#93441C'],
  royal:    ['#D6DDF5', '#6E7FC4', '#2A3670']
};

function artwork(motif, palette, seed = 1, w = 900, h = 1100) {
  const [c1, c2, c3] = PALETTES[palette] || PALETTES.saffron;
  const id = `g${seed}`;
  const rays = Array.from({ length: 12 }, (_, i) =>
    `<path d="M${w / 2} ${h * 0.42} L${w / 2 - 40} ${h * 0.42 - 400} L${w / 2 + 40} ${h * 0.42 - 400} Z" transform="rotate(${i * 30} ${w / 2} ${h * 0.42})" fill="url(#ray${seed})" opacity=".28"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="52%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow${seed}" cx="50%" cy="40%" r="62%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ray${seed}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#FFF6DC" stop-opacity=".9"/><stop offset="100%" stop-color="#FFF6DC" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#${id})"/>
  ${rays}
  <rect width="${w}" height="${h}" fill="url(#glow${seed})"/>
  <g opacity=".33" stroke="#FFF6DC" fill="none" stroke-width="1.6">
    <circle cx="${w / 2}" cy="${h * 0.42}" r="${w * 0.36}"/>
    <circle cx="${w / 2}" cy="${h * 0.42}" r="${w * 0.30}" stroke-dasharray="6 12"/>
    <circle cx="${w / 2}" cy="${h * 0.42}" r="${w * 0.23}"/>
  </g>
  <g transform="translate(${w / 2 - 200} ${h * 0.42 - 200}) scale(2)" color="#FFF8E6" opacity=".92">${MOTIF[motif] || MOTIF.lotus}</g>
  <g opacity=".5" fill="none" stroke="#FFF6DC" stroke-width="1.4">
    <path d="M0 ${h * 0.80} Q ${w / 2} ${h * 0.72} ${w} ${h * 0.80}"/>
    <path d="M0 ${h * 0.85} Q ${w / 2} ${h * 0.77} ${w} ${h * 0.85}" stroke-dasharray="5 10"/>
  </g>
  <g opacity=".22" fill="#2B1B47">
    <rect y="${h - 4}" width="${w}" height="4"/>
  </g>
</svg>`;
}

/* --------------------------------------------------------- write all */
write('pattern-mandala.svg', mandala('#F5B841'));
write('pattern-lotus.svg', lotusPattern('#E8CE8F'));

// logo
write('logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <g color="#7A3D0E" transform="translate(0 6)">${MOTIF.lotus}</g>
  <g fill="none" stroke="#7A3D0E" stroke-width="2.4" opacity=".7">
    <circle cx="100" cy="100" r="92" stroke-dasharray="5 8"/>
  </g></svg>`);

// UPI QR placeholder (decorative)
let qrCells = '';
const rnd = (s => () => (s = (s * 9301 + 49297) % 233280) / 233280)(7);
for (let x = 0; x < 21; x++) for (let y = 0; y < 21; y++) {
  const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
  if (finder) continue;
  if (rnd() > 0.52) qrCells += `<rect x="${x * 10 + 5}" y="${y * 10 + 5}" width="10" height="10"/>`;
}
const finderBox = (x, y) => `<rect x="${x}" y="${y}" width="70" height="70" fill="none" stroke="#2B1B47" stroke-width="10"/><rect x="${x + 20}" y="${y + 20}" width="30" height="30" fill="#2B1B47"/>`;
write('upi-qr.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220">
  <rect width="220" height="220" fill="#fff"/>
  <g fill="#2B1B47">${qrCells}</g>
  ${finderBox(5, 5)}${finderBox(145, 5)}${finderBox(5, 145)}
  <rect x="80" y="80" width="60" height="60" rx="10" fill="#fff"/>
  <g transform="translate(60 60) scale(.5)" color="#E2701E">${MOTIF.lotus}</g>
</svg>`);

const IMAGES = [
  ['hero-1.svg', 'peacock', 'indigo', 900, 1200],
  ['hero-2.svg', 'cow', 'saffron', 900, 1200],
  ['hero-3.svg', 'food', 'teal', 900, 1200],
  ['welcome.svg', 'om', 'gold', 900, 1120],
  ['about-hero.svg', 'lotus', 'indigo', 1400, 700],
  ['story.svg', 'diya', 'copper', 900, 1120],
  ['founder.svg', 'om', 'indigo', 800, 900],
  ['team-1.svg', 'om', 'saffron', 700, 700],
  ['team-2.svg', 'lotus', 'rose', 700, 700],
  ['team-3.svg', 'diya', 'gold', 700, 700],
  ['team-4.svg', 'health', 'teal', 700, 700],
  ['seva-hero.svg', 'hands', 'teal', 1400, 700],
  ['seva-food.svg', 'food', 'saffron', 900, 560],
  ['seva-cow.svg', 'cow', 'sage', 900, 560],
  ['seva-education.svg', 'book', 'royal', 900, 560],
  ['seva-health.svg', 'health', 'teal', 900, 560],
  ['seva-cloth.svg', 'cloth', 'rose', 900, 560],
  ['seva-elderly.svg', 'home', 'copper', 900, 560],
  ['gallery-hero.svg', 'peacock', 'rose', 1400, 700],
  ['g1.svg', 'food', 'saffron', 800, 600],
  ['g2.svg', 'cow', 'sage', 800, 600],
  ['g3.svg', 'book', 'royal', 800, 600],
  ['g4.svg', 'health', 'teal', 800, 600],
  ['g5.svg', 'diya', 'gold', 800, 600],
  ['g6.svg', 'hands', 'copper', 800, 600],
  ['g7.svg', 'cow', 'teal', 800, 600],
  ['g8.svg', 'book', 'rose', 800, 600],
  ['g9.svg', 'peacock', 'indigo', 800, 600],
  ['events-hero.svg', 'diya', 'gold', 1400, 700],
  ['event-1.svg', 'diya', 'gold', 800, 640],
  ['event-2.svg', 'cow', 'sage', 800, 640],
  ['event-3.svg', 'cloth', 'royal', 800, 640],
  ['event-4.svg', 'flute', 'indigo', 800, 640],
  ['event-5.svg', 'om', 'saffron', 800, 640],
  ['donate-hero.svg', 'hands', 'saffron', 1400, 700],
  ['volunteer-hero.svg', 'hands', 'sage', 1400, 700],
  ['blog-hero.svg', 'book', 'copper', 1400, 700],
  ['blog-1.svg', 'flute', 'indigo', 900, 520],
  ['blog-2.svg', 'cow', 'sage', 900, 520],
  ['blog-3.svg', 'book', 'royal', 900, 520],
  ['contact-hero.svg', 'lotus', 'teal', 1400, 700],
  ['t1.svg', 'lotus', 'rose', 300, 300],
  ['t2.svg', 'om', 'gold', 300, 300],
  ['t3.svg', 'health', 'teal', 300, 300],
  ['og-image.svg', 'lotus', 'indigo', 1200, 630]
];

IMAGES.forEach(([name, motif, pal, w, h], i) => write(name, artwork(motif, pal, i + 1, w, h)));
console.log(`✓ ${IMAGES.length + 4} SVG assets banaye gaye → public/img/`);
