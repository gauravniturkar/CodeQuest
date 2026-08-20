import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/app.css';

import { SECTIONS } from './data/sections';
import { $, $$, attachRipple } from './lib/dom';
import { G, load, nextUnlockedIndex, reset, save } from './lib/store';
import { initTheme, setAccent, setMode, toggleMode, ACCENTS } from './lib/theme';
import { mountThemePanel } from './ui/themePanel';
import { registerCommands, toggle as togglePalette, isOpen as paletteOpen, close as closePalette } from './ui/palette';
import { toast } from './ui/toast';
import { closeMobileSidebar, renderRail, renderSidebar, toggleMobileSidebar, updateHUD } from './views/shell';
import { renderProblems } from './views/problems';
import { handleSolveKey, startSection } from './views/solve';
import { renderResult } from './views/result';
import { renderBoardPage } from './views/board';

type Route = 'problems' | 'solve' | 'result' | 'board';

let route: Route = 'problems';

const view = () => $('#view')!;

// ── routing ────────────────────────────────────────────────
function setRoute(next: Route): void {
  route = next;
  $$('.topnav button').forEach((b) => {
    const match = b.dataset.route === next || (next === 'solve' && b.dataset.route === 'problems');
    if (match) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

function goProblems(): void {
  G.currentSection = null;
  setRoute('problems');
  renderProblems(view(), openSection);
  renderSidebar(openSection);
}

function goBoard(): void {
  setRoute('board');
  void renderBoardPage(view());
}

function openSection(index: number): void {
  setRoute('solve');
  void startSection(view(), index, {
    onFinish: showResult,
    onExit: goProblems,
    onPick: openSection,
  });
}

function showResult(): void {
  setRoute('result');
  renderResult(view(), { onNext: openSection, onExit: goProblems, onPick: openSection });
}

// ── onboarding ─────────────────────────────────────────────
function enterApp(name: string): void {
  G.playerName = name;
  save();

  const onboard = $('#onboard');
  const app = $('#app');
  if (onboard) {
    onboard.style.transition = 'opacity 320ms var(--ease-out)';
    onboard.style.opacity = '0';
    window.setTimeout(() => (onboard.hidden = true), 320);
  }
  if (app) app.hidden = false;

  updateHUD();
  goProblems();
  void renderRail();
}

function setupOnboarding(): void {
  const input = $<HTMLInputElement>('#name-input');
  const start = $('#start-btn');
  const guest = $('#guest-btn');

  const returning = load();
  if (returning && input) input.value = G.playerName;

  const begin = (asGuest: boolean) => {
    const typed = input?.value.trim() ?? '';
    enterApp(asGuest ? 'Guest' : typed || 'Coder');
  };

  if (start) { attachRipple(start); start.addEventListener('click', () => begin(false)); }
  guest?.addEventListener('click', () => begin(true));
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') begin(false);
  });
  input?.focus();

  if (returning) {
    const heading = $('#onboard h1');
    if (heading) heading.textContent = 'Welcome back';
    const sub = $('#onboard p');
    if (sub) sub.textContent = `Your progress is saved — ${G.completed.size} of ${SECTIONS.length} sections cleared.`;
    if (start) start.textContent = 'Resume →';
  }
}

// ── chrome ─────────────────────────────────────────────────
function setupChrome(): void {
  const themeBtn = $('#theme-btn');
  const topbar = $<HTMLElement>('.topbar');
  if (themeBtn && topbar) mountThemePanel(topbar, themeBtn);

  $('#menu-btn')?.addEventListener('click', toggleMobileSidebar);
  $('#cmd-btn')?.addEventListener('click', togglePalette);

  $$('.topnav button').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.route === 'board') goBoard();
      else goProblems();
    });
  });

  $('#main')?.addEventListener('click', () => closeMobileSidebar());
}

function setupCommands(): void {
  registerCommands([
    ...SECTIONS.map((sec, i) => ({
      id: `open-${sec.id}`,
      icon: sec.icon,
      label: `Open ${sec.title}`,
      hint: sec.difficulty,
      keywords: `${sec.topics.join(' ')} section practice`,
      run: () => openSection(i),
    })),
    {
      id: 'resume',
      icon: '▶',
      label: 'Resume next section',
      keywords: 'continue play next',
      run: () => openSection(nextUnlockedIndex()),
    },
    { id: 'problems', icon: '☰', label: 'Go to problems', keywords: 'home list sections', run: goProblems },
    { id: 'board', icon: '🏅', label: 'Go to leaderboard', keywords: 'scores ranking', run: goBoard },
    {
      id: 'toggle-mode',
      icon: '◐',
      label: 'Toggle light / dark',
      hint: '⇧D',
      keywords: 'theme appearance black white',
      run: () => toast(`${toggleMode() === 'dark' ? 'Dark' : 'Light'} mode`, '◐'),
    },
    { id: 'mode-system', icon: '⚙', label: 'Use system appearance', keywords: 'auto theme', run: () => setMode('system') },
    ...ACCENTS.map((a) => ({
      id: `accent-${a.id}`,
      icon: '●',
      label: `Accent: ${a.label}`,
      hint: a.note,
      keywords: 'colour color theme palette',
      run: () => { setAccent(a.id); toast(`${a.label} accent`, '●'); },
    })),
    {
      id: 'reset',
      icon: '⟲',
      label: 'Reset all progress',
      keywords: 'clear wipe delete start over',
      run: () => {
        if (!confirm('Reset all progress? This clears your XP, streak and completed sections on this device.')) return;
        reset();
        updateHUD();
        goProblems();
        void renderRail();
        toast('Progress reset', '⟲');
      },
    },
  ]);
}

function setupKeys(): void {
  document.addEventListener('keydown', (e) => {
    const typing =
      e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePalette();
      return;
    }
    if (e.key === 'Escape' && paletteOpen()) { closePalette(); return; }
    if (paletteOpen() || $('#onboard')?.hidden === false) return;

    if (e.shiftKey && e.key.toLowerCase() === 'd' && !typing) {
      e.preventDefault();
      toggleMode();
      return;
    }
    if (route === 'solve' && !typing) {
      if (handleSolveKey(e)) e.preventDefault();
      return;
    }
    if (route === 'solve' && typing && e.key === 'Enter') return;
  });
}

// ── boot ───────────────────────────────────────────────────
initTheme();
setupOnboarding();
setupChrome();
setupCommands();
setupKeys();
