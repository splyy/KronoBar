(() => {
  const IMGS = [
    'images/screenshot-1.png',
    'images/screenshot-2.png',
    'images/screenshot-3.png',
    'images/screenshot-4.png',
    'images/screenshot-5.png'
  ];
  const LABELS = ["Aujourd'hui", "Saisie", "Historique", "Stats", "Réglages"];

  // ─ Theme toggle ─
  const themeBtn = document.getElementById('themeBtn');
  themeBtn.addEventListener('click', () => {
    const h = document.documentElement;
    const dark = h.dataset.theme === 'dark';
    h.dataset.theme = dark ? 'light' : 'dark';
    localStorage.setItem('theme', h.dataset.theme);
  });

  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.dataset.theme = saved;
  }

  // ─ Hero phone switcher ─
  let heroCur = 0;
  const heroImg = document.getElementById('heroPhone');
  const snavBtns = document.querySelectorAll('.snav-btn');

  function setHeroScreen(i) {
    heroCur = i;
    heroImg.style.opacity = '0';
    setTimeout(() => {
      heroImg.src = IMGS[i];
      heroImg.style.opacity = '1';
    }, 180);
    snavBtns.forEach(b => b.classList.remove('on'));
    snavBtns[i].classList.add('on');
  }

  snavBtns.forEach(btn => {
    btn.addEventListener('click', () => setHeroScreen(Number(btn.dataset.screen)));
  });

  // Auto-rotate hero
  setInterval(() => {
    setHeroScreen((heroCur + 1) % IMGS.length);
  }, 3800);

  // ─ Lightbox ─
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbLabel = document.getElementById('lbLabel');
  let lbCur = 0;

  function openLightbox(i) {
    lbCur = i;
    lb.style.display = 'flex';
    lbImg.src = IMGS[i];
    lbLabel.textContent = `${String(i + 1).padStart(2, '0')} / 05 — ${LABELS[i]}`;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.style.display = 'none';
    document.body.style.overflow = '';
  }

  function lbNav(dir) {
    lbCur = (lbCur + dir + IMGS.length) % IMGS.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = IMGS[lbCur];
      lbLabel.textContent = `${String(lbCur + 1).padStart(2, '0')} / 05 — ${LABELS[lbCur]}`;
      lbImg.style.opacity = '1';
    }, 120);
  }

  document.querySelectorAll('.gal-item[data-lightbox]').forEach(item => {
    item.addEventListener('click', () => openLightbox(Number(item.dataset.lightbox)));
  });

  lb.querySelector('.lb-prev').addEventListener('click', () => lbNav(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => lbNav(1));
  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (lb.style.display === 'flex') {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lbNav(-1);
      if (e.key === 'ArrowRight') lbNav(1);
    }
  });

  // ─ Scroll animations ─
  const observer = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) setTimeout(() => e.target.classList.add('in'), i * 75);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.feat-card, .gal-item').forEach(c => observer.observe(c));

  // ─ Fetch latest GitHub release ─
  const REPO = 'splyy/KronoBar';
  const API = `https://api.github.com/repos/${REPO}/releases/latest`;

  function applyRelease(data) {
    const version = data.tag_name;
    const assets = data.assets || [];

    const macZip = assets.find(a => /KronoBar-darwin-arm64-.+\.zip/.test(a.name));
    const winExe = assets.find(a => /KronoBar-.+Setup\.exe/.test(a.name));

    // Version display
    const heroVer = document.getElementById('heroVersion');
    if (heroVer) heroVer.textContent = `${version} — macOS & Windows`;

    // Download links
    if (macZip) {
      const el = document.getElementById('dl-mac');
      if (el) el.href = macZip.browser_download_url;
    }
    if (winExe) {
      const el = document.getElementById('dl-win');
      if (el) el.href = winExe.browser_download_url;
    }

    // CTA main button — detect OS
    const ctaMain = document.getElementById('cta-main');
    if (ctaMain) {
      const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
      if (isMac && macZip) {
        ctaMain.href = macZip.browser_download_url;
      } else if (winExe) {
        ctaMain.href = winExe.browser_download_url;
      }
    }
  }

  const cached = sessionStorage.getItem('kronobar-release');
  if (cached) {
    applyRelease(JSON.parse(cached));
  } else {
    fetch(API)
      .then(r => r.json())
      .then(data => {
        if (data.tag_name) {
          sessionStorage.setItem('kronobar-release', JSON.stringify(data));
          applyRelease(data);
        }
      })
      .catch(() => {});
  }
})();
