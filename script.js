/* HEW Diamonds — homepage interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Demo links: keep "#" placeholders from jumping to top ---------- */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- Sticky nav style ---------- */
  var nav = document.getElementById('nav');
  function updateNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
  }

  toggle.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('menu-open'));
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) setMenu(false);
  });

  /* ---------- Hero sparkles ---------- */
  var sparkles = document.getElementById('sparkles');
  if (sparkles && !reduceMotion) {
    var count = window.innerWidth < 760 ? 14 : 26;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.className = 'spark';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 100) + '%';
      s.style.animationDelay = (Math.random() * 5).toFixed(2) + 's';
      s.style.animationDuration = (3 + Math.random() * 4).toFixed(2) + 's';
      sparkles.appendChild(s);
    }
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(function (el) {
    var d = parseInt(el.getAttribute('data-delay') || '0', 10);
    el.style.setProperty('--d', d);
  });

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Active section dots ---------- */
  var sections = document.querySelectorAll('[data-section]');
  var dotLinks = document.querySelectorAll('#dots a');

  function setActive(id) {
    dotLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });
  }
  setActive('hero');

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { threshold: 0.5 });
    sections.forEach(function (sec) { sectionObserver.observe(sec); });
  }

  /* ---------- Subtle hero parallax ---------- */
  var heroVisual = document.getElementById('heroVisual');
  var ticking = false;

  function onScroll() {
    updateNav();
    if (heroVisual && !reduceMotion && window.scrollY < window.innerHeight * 1.2) {
      heroVisual.style.setProperty('--py', (window.scrollY * 0.14).toFixed(1) + 'px');
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  updateNav();
})();
