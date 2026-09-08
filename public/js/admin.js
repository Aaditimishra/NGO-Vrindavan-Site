/* ==========================================================================
   Vardan Shri Golok Dham Seva Trust — Admin CMS
   Poori website ka content yahin se badla ja sakta hai.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let state = null;         // poora content.json
  let dirty = false;
  let current = 'site';

  /* ------------------------------------------------------ path helpers */
  const get = (obj, p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const set = (obj, p, v) => {
    const parts = p.split('.');
    const last = parts.pop();
    const target = parts.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[last] = v;
  };

  /* =========================================================== SCHEMA == */
  const F = {
    t: (k, label, hint) => ({ k, label, hint, type: 'text' }),
    ta: (k, label, hint) => ({ k, label, hint, type: 'textarea' }),
    long: (k, label, hint) => ({ k, label, hint, type: 'longtext' }),
    img: (k, label, hint) => ({ k, label, hint, type: 'image' }),
    date: (k, label, hint) => ({ k, label, hint, type: 'date' }),
    url: (k, label, hint) => ({ k, label, hint, type: 'url' }),
    tags: (k, label, hint) => ({ k, label, hint, type: 'tags' }),
    sel: (k, label, options, hint) => ({ k, label, hint, type: 'select', options }),
    list: (k, label, itemLabel, fields, hint) => ({ k, label, hint, type: 'list', itemLabel, fields })
  };

  const ICONS = ['lotus', 'food', 'cow', 'book', 'health', 'cloth', 'home', 'family', 'hands', 'heart', 'shield'];

  const SCHEMA = [
    /* ---------------------------------------------------------- 1. site */
    {
      id: 'site', icon: '🏛️', label: 'ट्रस्ट की जानकारी',
      panels: [
        { title: 'बुनियादी विवरण', path: 'site', desc: 'ट्रस्ट का नाम, स्थापना वर्ष एवं पंजीकरण संबंधी जानकारी।', fields: [
          F.t('nameHi', 'ट्रस्ट का नाम (हिंदी)'), F.t('name', 'Trust Name (English)'),
          F.t('shortName', 'संक्षिप्त नाम'), F.t('estYear', 'स्थापना वर्ष', 'जैसे 2022'),
          F.t('tagline', 'मुख्य वाक्य (हिंदी)'), F.t('taglineEn', 'Tagline (English)'),
          F.img('logo', 'लोगो'),
          F.t('regNo', 'पंजीकरण संख्या'), F.t('pan', 'PAN नंबर'),
          F.t('eightyG', '80G पंजीकरण सं.'), F.t('twelveA', '12A पंजीकरण सं.')
        ]},
        { title: 'सोशल मीडिया लिंक', path: 'social', desc: 'खाली छोड़ने पर वह आइकन वेबसाइट पर नहीं दिखेगा।', fields: [
          F.url('facebook', 'Facebook'), F.url('instagram', 'Instagram'), F.url('youtube', 'YouTube'),
          F.url('twitter', 'X / Twitter'), F.url('linkedin', 'LinkedIn')
        ]},
        { title: 'फुटर (पृष्ठ का निचला भाग)', path: 'footer', fields: [
          F.ta('about', 'ट्रस्ट का संक्षिप्त परिचय'),
          F.t('copyright', 'कॉपीराइट में दिखने वाला नाम'), F.t('credit', 'नीचे लिखा संदेश')
        ]}
      ]
    },
    /* ------------------------------------------------------- 2. contact */
    {
      id: 'contact', icon: '☎️', label: 'संपर्क विवरण',
      panels: [
        { title: 'संपर्क जानकारी', path: 'contact', desc: 'यहाँ किया गया बदलाव पूरी वेबसाइट (हेडर, फुटर, संपर्क पृष्ठ) पर तुरंत दिखेगा।', fields: [
          F.t('phone', 'मुख्य फोन नंबर'), F.t('phoneAlt', 'वैकल्पिक फोन नंबर'),
          F.t('whatsapp', 'व्हाट्सएप नंबर', 'देश कोड सहित, जैसे +919876543210'),
          F.t('email', 'मुख्य ईमेल'), F.t('emailAlt', 'वैकल्पिक ईमेल'),
          F.t('addressLine1', 'पता — पहली पंक्ति'), F.t('addressLine2', 'पता — दूसरी पंक्ति'),
          F.t('timings', 'खुलने का समय'),
          F.ta('mapEmbed', 'Google Map Embed URL', 'Google Maps → Share → Embed a map → src="..." वाला लिंक'),
          F.url('mapLink', 'Google Maps लिंक')
        ]},
        { title: 'संपर्क पृष्ठ की सामग्री', path: 'contact', fields: [
          F.t('heroTitle', 'पृष्ठ का शीर्षक'), F.t('heroSubtitle', 'उपशीर्षक'),
          F.ta('intro', 'परिचय पंक्ति'), F.t('formHeading', 'फॉर्म का शीर्षक')
        ]}
      ]
    },
    /* ---------------------------------------------------------- 3. home */
    {
      id: 'home', icon: '🏠', label: 'मुख्य पृष्ठ',
      panels: [
        { title: 'मुख्य स्लाइडर', path: 'home', desc: 'ऊपर घूमने वाली बड़ी स्लाइड्स। हर स्लाइड अपने आप 6.5 सेकंड में बदलती है।', fields: [
          F.list('heroSlides', 'स्लाइड्स', 'title', [
            F.t('shlok', 'श्लोक / छोटी पंक्ति'), F.t('title', 'मुख्य शीर्षक'),
            F.t('titleHighlight', 'सुनहरा शीर्षक (दूसरी पंक्ति)'), F.ta('subtitle', 'विवरण'),
            F.img('image', 'चित्र'),
            F.t('btnText', 'पहला बटन — टेक्स्ट'), F.t('btnLink', 'पहला बटन — लिंक', '/donate, /seva आदि'),
            F.t('btn2Text', 'दूसरा बटन — टेक्स्ट'), F.t('btn2Link', 'दूसरा बटन — लिंक')
          ])
        ]},
        { title: 'स्वागत अनुभाग', path: 'home', fields: [
          F.t('welcomeHeading', 'शीर्षक'), F.t('welcomeSubheading', 'उपशीर्षक'),
          F.ta('welcomeText', 'पहला पैराग्राफ'), F.ta('welcomeText2', 'दूसरा पैराग्राफ'),
          F.img('welcomeImage', 'चित्र'), F.t('welcomeBtnText', 'बटन का टेक्स्ट')
        ]},
        { title: 'आँकड़े (गिनती वाली पट्टी)', path: 'home', fields: [
          F.list('stats', 'आँकड़े', 'label', [
            F.t('number', 'संख्या', 'केवल अंक, जैसे 1200'), F.t('suffix', 'संख्या के बाद', 'जैसे +'),
            F.t('label', 'विवरण'), F.sel('icon', 'आइकन', ICONS)
          ])
        ]},
        { title: 'अन्य अनुभाग', path: 'home', fields: [
          F.t('sevaHeading', 'सेवा अनुभाग — शीर्षक'), F.t('sevaSubheading', 'सेवा अनुभाग — उपशीर्षक'),
          F.ta('quote', 'बड़ा उद्धरण (हरे बैनर में)'), F.t('quoteAuthor', 'उद्धरण किसका'),
          F.t('ctaHeading', 'दान बैनर — शीर्षक'), F.ta('ctaText', 'दान बैनर — विवरण'),
          F.t('ctaBtnText', 'दान बैनर — बटन')
        ]}
      ]
    },
    /* --------------------------------------------------------- 4. about */
    {
      id: 'about', icon: '📖', label: 'हमारे बारे में',
      panels: [
        { title: 'पृष्ठ शीर्षक', path: 'about', fields: [
          F.t('heroTitle', 'शीर्षक'), F.t('heroSubtitle', 'उपशीर्षक')
        ]},
        { title: 'हमारी कहानी', path: 'about', fields: [
          F.t('storyHeading', 'शीर्षक'), F.long('storyText', 'पहला पैराग्राफ'),
          F.long('storyText2', 'दूसरा पैराग्राफ'), F.img('storyImage', 'चित्र')
        ]},
        { title: 'ध्येय एवं स्वप्न', path: 'about', fields: [
          F.ta('mission', 'हमारा ध्येय (Mission)'), F.ta('vision', 'हमारा स्वप्न (Vision)')
        ]},
        { title: 'हमारे मूल्य', path: 'about', fields: [
          F.list('values', 'मूल्य', 'title', [F.t('title', 'शीर्षक'), F.ta('text', 'विवरण')])
        ]},
        { title: 'सेवा यात्रा (वर्षवार)', path: 'about', fields: [
          F.list('timeline', 'पड़ाव', 'year', [F.t('year', 'वर्ष'), F.t('title', 'शीर्षक'), F.ta('text', 'विवरण')])
        ]},
        { title: 'संस्थापक संदेश', path: 'about', fields: [
          F.t('founderName', 'नाम'), F.t('founderRole', 'पद'), F.img('founderImage', 'चित्र'),
          F.long('founderMessage', 'संदेश')
        ]},
        { title: 'हमारी टीम', path: 'about', fields: [
          F.t('teamHeading', 'अनुभाग का शीर्षक'),
          F.list('team', 'सदस्य', 'name', [
            F.t('name', 'नाम'), F.t('role', 'पद'), F.img('image', 'फोटो'), F.ta('bio', 'संक्षिप्त परिचय')
          ])
        ]}
      ]
    },
    /* ---------------------------------------------------------- 5. seva */
    {
      id: 'seva', icon: '🤲', label: 'सेवाएँ',
      panels: [
        { title: 'पृष्ठ शीर्षक', path: 'seva', fields: [
          F.t('heroTitle', 'शीर्षक'), F.t('heroSubtitle', 'उपशीर्षक'), F.ta('intro', 'परिचय')
        ]},
        { title: 'सेवा कार्य', path: 'seva', desc: 'ये सेवाएँ मुख्य पृष्ठ एवं सेवा पृष्ठ दोनों पर दिखती हैं।', fields: [
          F.list('items', 'सेवाएँ', 'title', [
            F.t('title', 'सेवा का नाम'), F.sel('icon', 'आइकन', ICONS),
            F.t('short', 'एक पंक्ति में विवरण'), F.long('text', 'पूरा विवरण'), F.img('image', 'चित्र')
          ])
        ]}
      ]
    },
    /* ------------------------------------------------------- 6. gallery */
    {
      id: 'gallery', icon: '🖼️', label: 'गैलरी',
      panels: [
        { title: 'पृष्ठ शीर्षक', path: 'gallery', fields: [
          F.t('heroTitle', 'शीर्षक'), F.t('heroSubtitle', 'उपशीर्षक')
        ]},
        { title: 'श्रेणियाँ', path: 'gallery', desc: 'पहली श्रेणी हमेशा "सभी" रखें। बाकी श्रेणियाँ चित्रों में इस्तेमाल होंगी।', fields: [
          F.tags('categories', 'श्रेणियाँ', 'Enter दबाकर नई श्रेणी जोड़ें')
        ]},
        { title: 'चित्र', path: 'gallery', fields: [
          F.list('images', 'चित्र', 'caption', [
            F.img('src', 'चित्र'), F.t('caption', 'कैप्शन'), F.t('category', 'श्रेणी', 'ऊपर दी गई श्रेणियों में से एक')
          ])
        ]}
      ]
    },
    /* -------------------------------------------------------- 7. events */
    {
      id: 'events', icon: '🎉', label: 'उत्सव एवं कार्यक्रम',
      panels: [
        { title: 'पृष्ठ शीर्षक', path: 'events', fields: [
          F.t('heroTitle', 'शीर्षक'), F.t('heroSubtitle', 'उपशीर्षक')
        ]},
        { title: 'आगामी कार्यक्रम', path: 'events', desc: 'ये मुख्य पृष्ठ पर भी दिखते हैं। कार्यक्रम बीत जाने पर इसे "संपन्न" सूची में ले जाएँ।', fields: [
          F.list('upcoming', 'कार्यक्रम', 'title', [
            F.t('title', 'कार्यक्रम का नाम'), F.date('date', 'तिथि'), F.t('time', 'समय'),
            F.t('venue', 'स्थान'), F.ta('text', 'विवरण'), F.img('image', 'चित्र')
          ])
        ]},
        { title: 'संपन्न कार्यक्रम', path: 'events', fields: [
          F.list('past', 'कार्यक्रम', 'title', [
            F.t('title', 'कार्यक्रम का नाम'), F.date('date', 'तिथि'), F.t('time', 'समय'),
            F.t('venue', 'स्थान'), F.ta('text', 'विवरण'), F.img('image', 'चित्र')
          ])
        ]}
      ]
    },
    /* -------------------------------------------------------- 8. donate */
    {
      id: 'donate', icon: '❤️', label: 'दान',
      panels: [
        { title: 'पृष्ठ शीर्षक', path: 'donate', fields: [
          F.t('heroTitle', 'शीर्षक'), F.t('heroSubtitle', 'उपशीर्षक'), F.ta('intro', 'परिचय')
        ]},
        { title: 'दान विकल्प (राशि कार्ड)', path: 'donate', fields: [
          F.list('options', 'विकल्प', 'title', [
            F.t('amount', 'राशि', 'केवल अंक, जैसे 1100'), F.t('title', 'शीर्षक'), F.ta('text', 'विवरण')
          ])
        ]},
        { title: 'बैंक खाता विवरण', path: 'donate.bank', desc: '⚠️ यह जानकारी वेबसाइट पर सार्वजनिक दिखती है — ध्यानपूर्वक भरें।', fields: [
          F.t('accountName', 'खाता नाम'), F.t('accountNumber', 'खाता संख्या'),
          F.t('bankName', 'बैंक का नाम'), F.t('branch', 'शाखा'),
          F.t('ifsc', 'IFSC कोड'), F.t('accountType', 'खाता प्रकार')
        ]},
        { title: 'UPI विवरण', path: 'donate.upi', fields: [
          F.t('id', 'UPI ID'), F.t('name', 'UPI पर दिखने वाला नाम'), F.img('qrImage', 'QR कोड चित्र', 'अपने बैंक/GPay का QR यहाँ अपलोड करें')
        ]},
        { title: 'अन्य जानकारी', path: 'donate', fields: [
          F.ta('taxNote', '80G / रसीद संबंधी सूचना'),
          F.t('inKindHeading', 'वस्तु दान — शीर्षक'), F.ta('inKindText', 'वस्तु दान — विवरण'),
          F.ta('trustNote', 'पारदर्शिता संबंधी संदेश')
        ]}
      ]
    },
    /* ----------------------------------------------------- 9. volunteer */
    {
      id: 'volunteer', icon: '🙋', label: 'स्वयंसेवक पृष्ठ',
      panels: [
        { title: 'पृष्ठ शीर्षक', path: 'volunteer', fields: [
          F.t('heroTitle', 'शीर्षक'), F.t('heroSubtitle', 'उपशीर्षक'), F.ta('intro', 'परिचय'),
          F.t('formHeading', 'फॉर्म का शीर्षक')
        ]},
        { title: 'सेवा के अवसर', path: 'volunteer', desc: 'ये विकल्प फॉर्म के ड्रॉपडाउन में भी अपने आप आ जाते हैं।', fields: [
          F.list('roles', 'अवसर', 'title', [F.t('title', 'सेवा का नाम'), F.ta('text', 'विवरण')])
        ]}
      ]
    },
    /* --------------------------------------------------------- 10. blog */
    {
      id: 'blog', icon: '📰', label: 'समाचार / ब्लॉग',
      panels: [
        { title: 'पृष्ठ शीर्षक', path: 'blog', fields: [
          F.t('heroTitle', 'शीर्षक'), F.t('heroSubtitle', 'उपशीर्षक')
        ]},
        { title: 'लेख', path: 'blog', desc: 'नया लेख जोड़ने पर "URL नाम" अंग्रेज़ी में, बिना स्पेस के लिखें — जैसे janmashtami-2026', fields: [
          F.list('posts', 'लेख', 'title', [
            F.t('title', 'शीर्षक'), F.t('slug', 'URL नाम', 'अंग्रेज़ी में, स्पेस की जगह - लगाएँ'),
            F.date('date', 'तिथि'), F.t('author', 'लेखक'), F.img('image', 'मुख्य चित्र'),
            F.ta('excerpt', 'संक्षिप्त सार'), F.long('content', 'पूरा लेख', 'नया पैराग्राफ शुरू करने के लिए एक खाली पंक्ति छोड़ें')
          ])
        ]}
      ]
    },
    /* --------------------------------------------- 11. testimonial/faq */
    {
      id: 'extras', icon: '💬', label: 'प्रशंसापत्र व प्रश्न',
      panels: [
        { title: 'प्रशंसापत्र (Testimonials)', path: '', fields: [
          F.list('testimonials', 'प्रशंसापत्र', 'name', [
            F.t('name', 'नाम'), F.t('role', 'परिचय / स्थान'), F.ta('text', 'क्या कहा'), F.img('image', 'फोटो')
          ])
        ]},
        { title: 'सामान्य प्रश्न (FAQ)', path: '', desc: 'ये दान पृष्ठ एवं संपर्क पृष्ठ दोनों पर दिखते हैं।', fields: [
          F.list('faq', 'प्रश्न', 'q', [F.t('q', 'प्रश्न'), F.ta('a', 'उत्तर')])
        ]}
      ]
    },
    /* ------------------------------------------------------- 12. inbox */
    { id: 'inbox', icon: '📬', label: 'प्राप्त संदेश', special: 'messages' },
    { id: 'vols', icon: '📝', label: 'स्वयंसेवक आवेदन', special: 'volunteers' },
    { id: 'settings', icon: '⚙️', label: 'सेटिंग्स', special: 'settings' }
  ];

  /* ====================================================== RENDER FIELDS */

  function fieldHTML(f, base) {
    const p = base ? `${base}.${f.k}` : f.k;
    const v = get(state, p);
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
    const label = `<label>${esc(f.label)}${hint}</label>`;

    switch (f.type) {
      case 'textarea':
        return `<div class="fld">${label}<textarea data-path="${p}">${esc(v)}</textarea></div>`;
      case 'longtext':
        return `<div class="fld">${label}<textarea class="tall" data-path="${p}">${esc(v)}</textarea></div>`;
      case 'select':
        return `<div class="fld">${label}<select data-path="${p}">${
          f.options.map(o => `<option value="${esc(o)}"${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')
        }</select></div>`;
      case 'date':
        return `<div class="fld">${label}<input type="date" data-path="${p}" value="${esc(v)}"></div>`;
      case 'url':
        return `<div class="fld">${label}<input type="url" data-path="${p}" value="${esc(v)}" placeholder="https://"></div>`;
      case 'image':
        return `<div class="fld">${label}
          <div class="img-fld">
            <div class="img-prev" data-prev-for="${p}">${
              v ? `<img src="${esc(v)}" alt="">` : '<span class="empty">कोई चित्र नहीं</span>'}</div>
            <div class="img-ctrl">
              <input type="text" data-path="${p}" data-img value="${esc(v)}" placeholder="/img/... या /uploads/...">
              <div class="img-btns">
                <button type="button" class="mini" data-upload="${p}">⬆ नया अपलोड करें</button>
                <button type="button" class="mini" data-library="${p}">🖼 लाइब्रेरी से चुनें</button>
              </div>
            </div>
          </div></div>`;
      case 'tags': {
        const arr = Array.isArray(v) ? v : [];
        return `<div class="fld">${label}
          <input type="text" data-tags="${p}" value="${esc(arr.join(', '))}" placeholder="अल्पविराम से अलग करें">
          </div>`;
      }
      case 'list':
        return listHTML(f, p);
      default:
        return `<div class="fld">${label}<input type="text" data-path="${p}" value="${esc(v)}"></div>`;
    }
  }

  function listHTML(f, p) {
    const arr = get(state, p) || [];
    const items = arr.map((item, i) => `
      <div class="list-item" data-list="${p}" data-idx="${i}">
        <div class="list-head">
          <span class="num">${i + 1}</span>
          <span class="ttl">${esc(item[f.itemLabel] || '(बिना शीर्षक)')}</span>
          <span class="item-acts">
            <button type="button" class="mini" data-move="${p}" data-from="${i}" data-dir="-1" title="ऊपर">↑</button>
            <button type="button" class="mini" data-move="${p}" data-from="${i}" data-dir="1" title="नीचे">↓</button>
            <button type="button" class="mini del" data-remove="${p}" data-idx="${i}">🗑 हटाएँ</button>
          </span>
          <span class="chev">▾</span>
        </div>
        <div class="list-body">${f.fields.map(sub => fieldHTML(sub, `${p}.${i}`)).join('')}</div>
      </div>`).join('');

    return `<div class="fld">
      <label>${esc(f.label)} <span class="hint">${arr.length} आइटम${f.hint ? ' · ' + esc(f.hint) : ''}</span></label>
      <div class="list-items">${items || '<p style="color:var(--a-muted);font-size:.9rem">अभी कोई आइटम नहीं है।</p>'}</div>
      <button type="button" class="btn-a add" data-add="${p}" data-fields='${esc(JSON.stringify(f.fields.map(x => x.k)))}'>+ नया जोड़ें</button>
    </div>`;
  }

  function renderSection(id) {
    current = id;
    const sec = SCHEMA.find(s => s.id === id);
    $$('.side-nav button').forEach(b => b.classList.toggle('active', b.dataset.sec === id));
    $('#secTitle').textContent = sec.label;
    $('#side').classList.remove('open');

    if (sec.special) return renderSpecial(sec);

    $('#savebar').style.display = 'flex';
    $('#content').innerHTML = sec.panels.map(pn => {
      const base = pn.path;
      return `<section class="panel">
        <h3>${esc(pn.title)}</h3>
        ${pn.desc ? `<p class="panel-desc">${esc(pn.desc)}</p>` : ''}
        ${pn.fields.map(f => fieldHTML(f, base)).join('')}
      </section>`;
    }).join('');
    window.scrollTo({ top: 0 });
  }

  /* ================================================= SPECIAL SECTIONS == */

  function renderSpecial(sec) {
    if (sec.special === 'settings') {
      $('#savebar').style.display = 'none';
      $('#content').innerHTML = `
        <div class="help"><b>सुरक्षा सलाह:</b> पहली बार लॉगिन करने के बाद पासवर्ड अवश्य बदलें। पासवर्ड किसी के साथ साझा न करें।</div>
        <section class="panel" style="max-width:520px">
          <h3>पासवर्ड बदलें</h3>
          <div class="fld"><label>वर्तमान पासवर्ड</label><input type="password" id="pwCur"></div>
          <div class="fld"><label>नया पासवर्ड <span class="hint">कम से कम 6 अक्षर</span></label><input type="password" id="pwNew"></div>
          <div class="fld"><label>नया पासवर्ड दोबारा</label><input type="password" id="pwNew2"></div>
          <button class="btn-a primary" id="pwSave">पासवर्ड बदलें</button>
        </section>
        <section class="panel">
          <h3>वेबसाइट</h3>
          <p class="panel-desc">बदलाव करने के बाद वेबसाइट पर जाकर देखें कि सब ठीक दिख रहा है।</p>
          <a href="/" target="_blank" class="btn-a ghost">🌐 वेबसाइट खोलें</a>
          <a href="/admin/logout" class="btn-a ghost" style="margin-left:8px">🚪 लॉगआउट</a>
        </section>`;
      $('#pwSave').onclick = changePassword;
      return;
    }

    // inbox
    $('#savebar').style.display = 'none';
    const isVol = sec.special === 'volunteers';
    const list = state[sec.special] || [];
    if (!list.length) {
      $('#content').innerHTML = `<div class="empty-state"><div class="big">${isVol ? '📝' : '📭'}</div>
        <p>अभी कोई ${isVol ? 'स्वयंसेवक आवेदन' : 'संदेश'} प्राप्त नहीं हुआ है।</p></div>`;
      return;
    }
    $('#content').innerHTML = `
      <div class="help">कुल <b>${list.length}</b> ${isVol ? 'आवेदन' : 'संदेश'} · <b>${list.filter(m => !m.read).length}</b> अपठित</div>
      ` + list.map(m => {
      const when = new Date(m.at).toLocaleString('hi-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const meta = [];
      if (m.phone) meta.push(`<span>📞 <a href="tel:${esc(m.phone)}">${esc(m.phone)}</a></span>`);
      if (m.email) meta.push(`<span>✉ <a href="mailto:${esc(m.email)}">${esc(m.email)}</a></span>`);
      if (m.city) meta.push(`<span>📍 ${esc(m.city)}</span>`);
      if (m.role) meta.push(`<span>🤲 ${esc(m.role)}</span>`);
      if (m.availability) meta.push(`<span>🕐 ${esc(m.availability)}</span>`);
      if (m.subject) meta.push(`<span>📌 ${esc(m.subject)}</span>`);
      const wa = m.phone ? `<a class="mini" href="https://wa.me/${String(m.phone).replace(/\D/g, '')}" target="_blank">💬 व्हाट्सएप</a>` : '';
      return `<div class="msg ${m.read ? '' : 'unread'}">
        <div class="msg-top">
          <b>${esc(m.name)}</b>
          <span class="msg-acts">
            ${wa}
            <button class="mini" data-mark="${sec.special}" data-id="${esc(m.id)}" data-read="${m.read ? 'false' : 'true'}">${m.read ? '↩ अपठित करें' : '✓ पढ़ा हुआ'}</button>
            <button class="mini del" data-delmsg="${sec.special}" data-id="${esc(m.id)}">🗑 हटाएँ</button>
          </span>
        </div>
        <div class="msg-meta">${meta.join('')}<span>🕑 ${esc(when)}</span></div>
        ${m.message ? `<p>${esc(m.message)}</p>` : ''}
      </div>`;
    }).join('');
  }

  /* ============================================================ EVENTS */

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.path) {
      set(state, el.dataset.path, el.value);
      markDirty();
      if (el.dataset.img) {
        const prev = $(`[data-prev-for="${CSS.escape(el.dataset.path)}"]`);
        if (prev) prev.innerHTML = el.value ? `<img src="${esc(el.value)}" alt="">` : '<span class="empty">कोई चित्र नहीं</span>';
      }
      // list heading live update
      const item = el.closest('.list-item');
      if (item) {
        const listPath = item.dataset.list;
        const f = findListField(listPath);
        if (f && el.dataset.path.endsWith('.' + f.itemLabel)) {
          item.querySelector('.ttl').textContent = el.value || '(बिना शीर्षक)';
        }
      }
    }
    if (el.dataset.tags) {
      set(state, el.dataset.tags, el.value.split(',').map(s => s.trim()).filter(Boolean));
      markDirty();
    }
  });

  function findListField(path) {
    for (const sec of SCHEMA) {
      if (!sec.panels) continue;
      for (const pn of sec.panels) {
        for (const f of pn.fields) {
          if (f.type === 'list' && (pn.path ? `${pn.path}.${f.k}` : f.k) === path) return f;
        }
      }
    }
    return null;
  }

  document.addEventListener('click', async (e) => {
    const t = e.target.closest('button, .list-head, a.mini');
    if (!t) return;

    // sidebar nav
    if (t.dataset.sec) { renderSection(t.dataset.sec); return; }

    // accordion
    if (t.classList.contains('list-head')) { t.closest('.list-item').classList.toggle('open'); return; }

    // add item
    if (t.dataset.add) {
      const path = t.dataset.add;
      const keys = JSON.parse(t.dataset.fields.replace(/&quot;/g, '"'));
      const arr = get(state, path) || [];
      const blank = {};
      keys.forEach(k => { blank[k] = ''; });
      arr.push(blank);
      set(state, path, arr);
      markDirty(); renderSection(current);
      const items = $$(`[data-list="${path}"]`);
      items[items.length - 1]?.classList.add('open');
      items[items.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // remove item
    if (t.dataset.remove) {
      const f0 = findListField(t.dataset.remove);
      const nm = (get(state, t.dataset.remove)[parseInt(t.dataset.idx)] || {})[f0 ? f0.itemLabel : ''] || 'यह आइटम';
      if (!await confirmBox(`"${nm}" को हटाना है?`, 'हटाने के बाद ऊपर "सहेजें" दबाना न भूलें।')) return;
      const arr = get(state, t.dataset.remove);
      arr.splice(parseInt(t.dataset.idx), 1);
      markDirty(); renderSection(current);
      return;
    }

    // move item
    if (t.dataset.move) {
      const arr = get(state, t.dataset.move);
      const from = parseInt(t.dataset.from), to = from + parseInt(t.dataset.dir);
      if (to < 0 || to >= arr.length) return;
      [arr[from], arr[to]] = [arr[to], arr[from]];
      markDirty(); renderSection(current);
      return;
    }

    // upload / library
    if (t.dataset.upload) { pickFile(t.dataset.upload); return; }
    if (t.dataset.library) { openLibrary(t.dataset.library); return; }

    // inbox actions
    if (t.dataset.mark) {
      await fetch(`/admin/api/inbox/${t.dataset.mark}/${t.dataset.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: t.dataset.read === 'true' })
      });
      await reload(); renderSection(current); updateBadges();
      return;
    }
    if (t.dataset.delmsg) {
      if (!await confirmBox('इसे स्थायी रूप से हटाएँ?', 'यह वापस नहीं आएगा।')) return;
      await fetch(`/admin/api/inbox/${t.dataset.delmsg}/${t.dataset.id}`, { method: 'DELETE' });
      await reload(); renderSection(current); updateBadges();
      return;
    }
  });

  /* ============================================================ UPLOAD */

  let targetPath = null;
  function pickFile(path) { targetPath = path; $('#fileInput').click(); }

  $('#fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) await doUpload(file);
    e.target.value = '';
  });

  async function doUpload(file) {
    const fd = new FormData();
    fd.append('file', file);
    toast('अपलोड हो रहा है...');
    try {
      const res = await fetch('/admin/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) return toast(data.error || 'अपलोड विफल', 'err');
      if (targetPath) { applyImage(targetPath, data.url); toast('चित्र अपलोड हो गया ✓', 'ok'); }
      else { toast('चित्र लाइब्रेरी में जुड़ गया ✓', 'ok'); loadLibrary(); }
    } catch (_) { toast('अपलोड में त्रुटि', 'err'); }
  }

  function applyImage(path, url) {
    set(state, path, url);
    markDirty();
    const input = $(`input[data-path="${CSS.escape(path)}"]`);
    if (input) input.value = url;
    const prev = $(`[data-prev-for="${CSS.escape(path)}"]`);
    if (prev) prev.innerHTML = `<img src="${esc(url)}" alt="">`;
  }

  async function openLibrary(path) {
    targetPath = path;
    $('#mediaModal').classList.add('open');
    await loadLibrary();
  }

  async function loadLibrary() {
    const grid = $('#mediaGrid');
    grid.innerHTML = '<p style="color:var(--a-muted)">लोड हो रहा है...</p>';
    const files = await (await fetch('/admin/api/uploads')).json();
    const builtin = ['/img/hero-1.svg', '/img/hero-2.svg', '/img/hero-3.svg', '/img/welcome.svg', '/img/story.svg',
      '/img/founder.svg', '/img/seva-food.svg', '/img/seva-cow.svg', '/img/seva-education.svg', '/img/seva-health.svg',
      '/img/seva-cloth.svg', '/img/seva-elderly.svg', '/img/g1.svg', '/img/g2.svg', '/img/g3.svg', '/img/g4.svg',
      '/img/g5.svg', '/img/g6.svg', '/img/g7.svg', '/img/g8.svg', '/img/g9.svg'];
    const all = files.map(f => f.url).concat(builtin);
    grid.innerHTML = all.map(u => `<div class="media-item" data-pick="${esc(u)}"><img src="${esc(u)}" loading="lazy" alt=""></div>`).join('');
    $$('.media-item', grid).forEach(el => el.onclick = () => {
      applyImage(targetPath, el.dataset.pick);
      $('#mediaModal').classList.remove('open');
      toast('चित्र चुन लिया गया ✓', 'ok');
    });
  }

  $('#mediaClose').onclick = () => $('#mediaModal').classList.remove('open');
  $('#mediaModal').addEventListener('click', e => { if (e.target.id === 'mediaModal') e.currentTarget.classList.remove('open'); });
  const drop = $('#drop');
  drop.onclick = () => { targetPath = null; $('#fileInput').click(); };
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', async e => {
    targetPath = null;
    const f = e.dataTransfer.files[0];
    if (f) await doUpload(f);
  });

  /* ============================================================== SAVE */

  function markDirty() {
    dirty = true;
    const s = $('#status');
    s.className = 'status dirty';
    s.textContent = '● असहेजे बदलाव हैं';
  }

  async function save() {
    const btn = $('#saveBtn');
    btn.disabled = true; btn.textContent = 'सहेजा जा रहा है...';
    try {
      const res = await fetch('/admin/api/content', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state)
      });
      const data = await res.json();
      if (data.ok) {
        dirty = false;
        const s = $('#status'); s.className = 'status saved';
        s.textContent = '✓ सहेजा गया — ' + new Date().toLocaleTimeString('hi-IN');
        toast('सभी बदलाव सहेज दिए गए ✓', 'ok');
      } else toast(data.error || 'सहेजने में त्रुटि', 'err');
    } catch (_) { toast('सर्वर से संपर्क नहीं हुआ', 'err'); }
    finally { btn.disabled = false; btn.textContent = '💾 सहेजें'; }
  }

  async function changePassword() {
    const cur = $('#pwCur').value, n1 = $('#pwNew').value, n2 = $('#pwNew2').value;
    if (n1 !== n2) return toast('दोनों नए पासवर्ड एक जैसे नहीं हैं', 'err');
    const res = await fetch('/admin/api/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: cur, next: n1 })
    });
    const data = await res.json();
    toast(data.ok ? data.message : data.error, data.ok ? 'ok' : 'err');
    if (data.ok) { $('#pwCur').value = $('#pwNew').value = $('#pwNew2').value = ''; }
  }

  /* ============================================================= UTILS */

  function confirmBox(title, note) {
    return new Promise((resolve) => {
      const el = $('#confirmModal');
      $('#confirmTitle').textContent = title;
      $('#confirmNote').textContent = note || '';
      el.classList.add('open');
      const done = (v) => {
        el.classList.remove('open');
        $('#confirmYes').onclick = $('#confirmNo').onclick = null;
        document.removeEventListener('keydown', onKey);
        resolve(v);
      };
      const onKey = (e) => { if (e.key === 'Escape') done(false); if (e.key === 'Enter') done(true); };
      $('#confirmYes').onclick = () => done(true);
      $('#confirmNo').onclick = () => done(false);
      document.addEventListener('keydown', onKey);
    });
  }

  let toastTimer;
  function toast(msg, kind) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function updateBadges() {
    const m = (state.messages || []).filter(x => !x.read).length;
    const v = (state.volunteers || []).filter(x => !x.read).length;
    const set1 = $('#badge-inbox'), set2 = $('#badge-vols');
    if (set1) { set1.textContent = m || ''; set1.style.display = m ? '' : 'none'; }
    if (set2) { set2.textContent = v || ''; set2.style.display = v ? '' : 'none'; }
  }

  async function reload() { state = await (await fetch('/admin/api/content')).json(); }

  /* ============================================================== INIT */

  function buildNav() {
    $('#sideNav').innerHTML = SCHEMA.map(s => `
      <li><button data-sec="${s.id}">
        <span class="ico">${s.icon}</span>${esc(s.label)}
        ${s.id === 'inbox' ? '<span class="pill" id="badge-inbox"></span>' : ''}
        ${s.id === 'vols' ? '<span class="pill" id="badge-vols"></span>' : ''}
      </button></li>`).join('');
  }

  (async function init() {
    await reload();
    buildNav();
    updateBadges();
    renderSection('site');
    $('#saveBtn').onclick = save;
    $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (dirty) save(); }
    });
    window.addEventListener('beforeunload', e => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
    setInterval(async () => {                       // naye sandeshon ke liye
      try { const d = await (await fetch('/admin/api/content')).json();
        state.messages = d.messages; state.volunteers = d.volunteers; updateBadges(); } catch (_) {}
    }, 60000);
  })();
})();
