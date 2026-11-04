/* ==========================================================
   HEW DIAMONDS — homepage behaviour
   Vanilla JS. No dependencies. Every feature degrades gracefully.
   ========================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Missing-asset fallbacks ---------- */
  $$('img').forEach(function (img) {
    function fail() {
      img.classList.add('img-missing');
      var brand = img.closest('.brand');
      if (brand) brand.classList.add('no-logo');
    }
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
  });

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  var toast = $('#toast'), toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  /* ---------- Header + hero scroll progress (rAF-throttled) ---------- */
  var header = $('#siteHeader');
  var hero = $('#home');
  var ticking = false;
  var heroH = hero ? hero.offsetHeight : window.innerHeight;
  var lastP = -1, lastScrolled = null;

  function update() {
    ticking = false;
    var y = window.pageYOffset || doc.scrollTop || 0;

    var scrolled = y > 24;
    if (scrolled !== lastScrolled && header) {
      header.classList.toggle('is-scrolled', scrolled);
      lastScrolled = scrolled;
    }

    if (!hero || reduceMotion.matches) return;

    // 0 → 1 across (almost) one hero height: the category page rises over the pinned hero.
    var p = Math.min(1, Math.max(0, y / (heroH * 0.92)));
    p = Math.round(p * 1000) / 1000;
    if (p !== lastP) {
      hero.style.setProperty('--p', p);
      hero.classList.toggle('is-done', p >= 1);
      lastP = p;
    }
  }

  function requestUpdate() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  function measure() {
    if (hero) heroH = hero.offsetHeight || window.innerHeight;
    lastP = -1;
    requestUpdate();
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('orientationchange', measure);
  window.addEventListener('pageshow', measure); // iOS back/forward cache
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', function () {
      if (reduceMotion.matches && hero) { hero.style.removeProperty('--p'); hero.classList.remove('is-done'); }
      measure();
    });
  }
  update();

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  var revealEls = $$('.reveal, .tile');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in');
        io.unobserve(el);
        if (el.classList.contains('tile')) {
          // after the entrance finishes, restore snappy hover timing
          setTimeout(function () { el.classList.add('settled'); }, 2800);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in', 'settled'); });
  }

  /* ---------- Hero: optional video + three framing views ---------- */
  var media = $('#heroMedia');
  var heroImg = $('#heroImg');
  var visual = heroImg;

  if (media && media.dataset.video) {
    var v = document.createElement('video');
    v.className = 'hero-video';
    v.src = media.dataset.video;
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.poster = heroImg ? heroImg.getAttribute('src') : '';
    v.addEventListener('canplay', function () {
      if (heroImg) heroImg.style.visibility = 'hidden';
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
    v.addEventListener('error', function () { v.remove(); });
    media.appendChild(v);
    visual = v;
  }

  var pager = $('#heroPager');
  var dots = pager ? $$('button', pager) : [];
  var view = 0, autoTimer = null, heroVisible = true;

  function setView(i) {
    view = i;
    dots.forEach(function (d, n) {
      if (n === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    if (visual) visual.setAttribute('data-view', String(i + 1));
  }
  function stopAuto() { clearInterval(autoTimer); autoTimer = null; }
  function startAuto() {
    stopAuto();
    if (reduceMotion.matches || !dots.length) return;
    autoTimer = setInterval(function () { if (heroVisible && !document.hidden) setView((view + 1) % dots.length); }, 7000);
  }
  dots.forEach(function (d, n) {
    d.addEventListener('click', function () { setView(n); startAuto(); });
  });
  if (dots.length) { setView(0); startAuto(); }
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }, { threshold: 0.2 }).observe(hero);
  }

  /* ---------- Menu ---------- */
  var menuBtn = $('#menuToggle');
  var menu = $('#menuPanel');
  var lastFocus = null;

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header.classList.toggle('menu-open', open);
    doc.style.overflow = open ? 'hidden' : '';
    menuBtn.innerHTML = open
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18M3 16h18"/></svg>';
    if (open) {
      setSearch(false);
      lastFocus = document.activeElement;
      var first = $('a', menu); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    }
  }
  if (menuBtn && menu) {
    menu.setAttribute('aria-hidden', 'true');
    // keep hidden links out of the tab order until opened
    menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Search ---------- */
  var searchBtn = $('#searchToggle');
  var searchPanel = $('#searchPanel');
  var searchInput = $('#searchInput');
  var searchMsg = $('#searchMsg');

  function setSearch(open) {
    if (!searchPanel || !searchBtn) return;
    searchPanel.hidden = !open;
    searchBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (header) header.classList.add('is-scrolled');
      setTimeout(function () { searchInput && searchInput.focus(); }, 30);
    } else {
      if (searchMsg) searchMsg.textContent = '';
      if (header) lastScrolled = null, requestUpdate();
    }
  }
  if (searchBtn && searchPanel) {
    searchBtn.addEventListener('click', function () {
      if (menu && menu.classList.contains('is-open')) setMenu(false);
      setSearch(searchPanel.hidden);
    });
    searchPanel.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = (searchInput.value || '').trim().toLowerCase();
      if (!q) { searchMsg.textContent = 'Try rings, necklaces, earrings, bangles or nose pins.'; return; }
      var term = q.replace(/s$/, '');
      var hit = $$('.tile').filter(function (t) {
        var names = (t.getAttribute('data-name') || '').toLowerCase();
        return names.indexOf(term) !== -1 || term.indexOf(names.split(' ')[0]) !== -1;
      })[0];
      if (!hit) { searchMsg.textContent = 'No match for “' + searchInput.value.trim() + '”. Try rings, necklaces, earrings, bangles or nose pins.'; return; }
      setSearch(false);
      searchInput.value = '';
      var top = hit.getBoundingClientRect().top + (window.pageYOffset || 0) - 120;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      hit.classList.remove('pulse'); void hit.offsetWidth; hit.classList.add('pulse');
      setTimeout(function () { hit.classList.remove('pulse'); }, 1800);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (menu && menu.classList.contains('is-open')) setMenu(false);
    if (searchPanel && !searchPanel.hidden) { setSearch(false); searchBtn.focus(); }
  });

  /* ---------- Wishlist + bag (demo only) ---------- */
  var wishCount = $('#wishCount');
  var wishBtn = $('#wishBtn');
  var wished = 0;

  function renderWish() {
    if (wishCount) wishCount.textContent = String(wished);
    if (wishBtn) wishBtn.setAttribute('aria-label', 'Wishlist, ' + wished + (wished === 1 ? ' item' : ' items'));
  }

  $$('.mini-btn.wish').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      wished += on ? 1 : -1;
      renderWish();
      showToast(on ? 'Saved to wishlist (demo)' : 'Removed from wishlist (demo)');
    });
  });
  $$('.mini-btn.bag').forEach(function (b) {
    b.addEventListener('click', function () { showToast('Demo site: the bag is not connected yet.'); });
  });
  var bagBtn = $('#bagBtn');
  if (bagBtn) bagBtn.addEventListener('click', function () { showToast('Demo site: the bag is not connected yet.'); });
  if (wishBtn) wishBtn.addEventListener('click', function () {
    showToast(wished ? 'You have ' + wished + ' saved ' + (wished === 1 ? 'piece' : 'pieces') + ' (demo)' : 'Your wishlist is empty (demo)');
  });

})();
