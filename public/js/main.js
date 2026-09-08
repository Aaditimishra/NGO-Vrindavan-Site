/* Vardan Shri Golok Dham Seva Trust — front-end interactions */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ------------------------------------------------ mobile nav */
  const nav = $('#mainNav'), toggle = $('#navToggle'), backdrop = $('#navBackdrop'), drawer = $('#navDrawer');
  function closeNav() { nav?.classList.remove('open'); drawer?.classList.remove('open'); toggle?.classList.remove('open'); backdrop?.classList.remove('show'); document.body.style.overflow = ''; }
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    drawer?.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    backdrop.classList.toggle('show', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  backdrop?.addEventListener('click', closeNav);
  drawer?.addEventListener('click', (e) => { if (e.target === drawer) closeNav(); });
  $$('#mainNav a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  /* --------------------------------------------- sticky header */
  const header = $('#siteHeader'), toTop = $('#toTop');
  const onScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 30);
    toTop?.classList.toggle('show', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ------------------------------------------- reveal on scroll */
  const revealables = $$('.reveal');
  if ('IntersectionObserver' in window && revealables.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px' });
    revealables.forEach(el => io.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('in'));
  }

  /* ------------------------------------------------ hero slider */
  const slides = $$('.hero-slide'), dots = $$('.hero-dots button');
  if (slides.length > 1) {
    let idx = 0, timer;
    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };
    const play = () => { clearInterval(timer); timer = setInterval(() => go(idx + 1), 6500); };
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); play(); }));
    play();
    const hero = $('.hero');
    hero?.addEventListener('mouseenter', () => clearInterval(timer));
    hero?.addEventListener('mouseleave', play);
  }

  /* ---------------------------------------------- stat counters */
  const stats = $$('[data-count]');
  if (stats.length && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target, target = parseFloat(el.dataset.count) || 0;
        const dur = 1600, start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN');
          if (p < 1) requestAnimationFrame(step); else el.textContent = target.toLocaleString('en-IN');
        };
        requestAnimationFrame(step);
        io2.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach(el => io2.observe(el));
  }

  /* -------------------------------------------- gallery filters */
  const filterBtns = $$('.gal-filters button');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    $$('.gal-item').forEach(item => {
      item.classList.toggle('hide', !(cat === 'all' || item.dataset.cat === cat));
    });
  }));

  /* ------------------------------------------------- lightbox */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let lbItems = [], lbIdx = 0;
  const showLb = (i) => {
    if (!lbItems.length) return;
    lbIdx = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbIdx];
    lbImg.src = it.src; lbImg.alt = it.cap; lbCap.textContent = it.cap;
  };
  const openLb = (i) => { lb.classList.add('open'); document.body.style.overflow = 'hidden'; showLb(i); };
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  function bindLightbox() {
    const items = $$('.gal-item:not(.hide)');
    lbItems = items.map(el => ({ src: el.dataset.full || el.querySelector('img').src, cap: el.dataset.cap || '' }));
    items.forEach((el, i) => { el.onclick = () => openLb(i); });
  }
  if (lb) {
    bindLightbox();
    filterBtns.forEach(b => b.addEventListener('click', bindLightbox));
    $('#lbClose')?.addEventListener('click', closeLb);
    $('#lbPrev')?.addEventListener('click', () => showLb(lbIdx - 1));
    $('#lbNext')?.addEventListener('click', () => showLb(lbIdx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') showLb(lbIdx - 1);
      if (e.key === 'ArrowRight') showLb(lbIdx + 1);
    });
  }

  /* ------------------------------------------------------ FAQ */
  $$('.faq-q').forEach(q => q.addEventListener('click', () => {
    const item = q.closest('.faq-item'), ans = item.querySelector('.faq-a');
    const open = item.classList.contains('open');
    $$('.faq-item').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
    if (!open) { item.classList.add('open'); ans.style.maxHeight = ans.scrollHeight + 'px'; }
  }));

  /* ------------------------------------------- copy to clipboard */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      const old = btn.textContent;
      btn.textContent = '✓ कॉपी हुआ';
      setTimeout(() => { btn.textContent = old; }, 1800);
    } catch (_) { /* clipboard blocked */ }
  }));

  /* ------------------------------------------------ ajax forms */
  $$('form[data-ajax]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const box = form.querySelector('.form-msg');
      const btn = form.querySelector('button[type=submit]');
      const label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'भेजा जा रहा है...'; }
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const data = await res.json();
        box.className = 'form-msg show ' + (data.ok ? 'ok' : 'err');
        box.textContent = data.ok ? data.message : (data.error || 'कुछ त्रुटि हुई, पुनः प्रयास करें।');
        if (data.ok) form.reset();
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (_) {
        box.className = 'form-msg show err';
        box.textContent = 'सर्वर से संपर्क नहीं हो पा रहा। कृपया पुनः प्रयास करें।';
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
      }
    });
  });
})();
