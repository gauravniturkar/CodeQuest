import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/app.css';
import './styles/landing.css';

import { SECTIONS } from './data/sections';
import { $, $$, countTo, esc, prefersReducedMotion } from './lib/dom';
import { ACCENTS, initTheme, setAccent, getAccent, toggleMode } from './lib/theme';
import { mountThemePanel } from './ui/themePanel';

initTheme();

// ── sticky nav ─────────────────────────────────────────────
const nav = $('#site-nav');
const onScroll = () => nav?.classList.toggle('stuck', window.scrollY > 24);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── theme panel ────────────────────────────────────────────
const themeBtn = $('#theme-btn');
if (themeBtn && nav) mountThemePanel(nav, themeBtn);

// ── track tiles ────────────────────────────────────────────
const grid = $('#track-grid');
if (grid) {
  grid.innerHTML = SECTIONS.map(
    (sec, i) => `
    <article class="track-tile" data-reveal style="--i:${i}">
      <div class="tt-top">
        <span class="tt-icon" aria-hidden="true">${esc(sec.icon)}</span>
        <span class="pill ${sec.difficulty.toLowerCase()}">${esc(sec.difficulty)}</span>
      </div>
      <h4>${String(i + 1).padStart(2, '0')} · ${esc(sec.title)}</h4>
      <p>${esc(sec.desc)}</p>
      <p class="mono" style="color:var(--accent)">+${sec.xp} XP</p>
    </article>`,
  ).join('');
}

// ── accent swatches ────────────────────────────────────────
const PREVIEW: Record<string, string> = {
  citrus: 'linear-gradient(135deg,hsl(72 92% 62%),hsl(88 80% 40%))',
  ember: 'linear-gradient(135deg,hsl(18 88% 60%),hsl(2 82% 46%))',
  ocean: 'linear-gradient(135deg,hsl(199 90% 58%),hsl(215 85% 44%))',
  violet: 'linear-gradient(135deg,hsl(265 82% 64%),hsl(288 70% 46%))',
  mono: 'linear-gradient(135deg,hsl(220 0% 74%),hsl(220 0% 26%))',
};

const swatches = $('#demo-swatches');
if (swatches) {
  swatches.innerHTML = ACCENTS.map(
    (a) => `
    <button class="swatch" data-accent="${a.id}" title="${esc(a.note)}"
            aria-label="${esc(a.label)} accent" aria-pressed="${a.id === getAccent()}"
            style="width:38px;height:38px;background:${PREVIEW[a.id]}"></button>`,
  ).join('');

  $$<HTMLButtonElement>('.swatch', swatches).forEach((btn) => {
    btn.addEventListener('click', () => {
      setAccent(btn.dataset.accent as (typeof ACCENTS)[number]['id']);
      $$('.swatch', swatches).forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.accent === getAccent()));
      });
    });
  });
}

$('#demo-mode')?.addEventListener('click', () => toggleMode());

// ── scroll reveal ──────────────────────────────────────────
const revealables = $$('[data-reveal]');
if (prefersReducedMotion()) {
  revealables.forEach((n) => n.classList.add('in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  revealables.forEach((node, i) => {
    if (!node.style.getPropertyValue('--i')) node.style.setProperty('--i', String(i % 6));
    io.observe(node);
  });
}

// ── hero counters ──────────────────────────────────────────
const counters = $$('[data-count]');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const node = entry.target as HTMLElement;
    countTo(node, Number(node.dataset.count ?? 0), 1100);
    counterIO.unobserve(node);
  });
});
counters.forEach((n) => counterIO.observe(n));
