export type Mode = 'light' | 'dark';
export type ModePref = Mode | 'system';
export type Accent = 'citrus' | 'ember' | 'ocean' | 'violet' | 'mono';

export const ACCENTS: { id: Accent; label: string; note: string }[] = [
  { id: 'citrus', label: 'Citrus', note: 'Acid yellow-green' },
  { id: 'ember', label: 'Ember', note: 'Warm orange' },
  { id: 'ocean', label: 'Ocean', note: 'Cool cyan' },
  { id: 'violet', label: 'Violet', note: 'Deep purple' },
  { id: 'mono', label: 'Mono', note: 'Pure black & white' },
];

const MODE_KEY = 'cq.mode';
const ACCENT_KEY = 'cq.accent';

const media = window.matchMedia('(prefers-color-scheme: dark)');

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

let modePref: ModePref = read(MODE_KEY, ['light', 'dark', 'system'] as const, 'dark');
let accent: Accent = read(ACCENT_KEY, ACCENTS.map((a) => a.id), 'citrus');

/** The mode actually rendered, after resolving 'system'. */
export function resolvedMode(): Mode {
  return modePref === 'system' ? (media.matches ? 'dark' : 'light') : modePref;
}

export function getModePref(): ModePref {
  return modePref;
}

export function getAccent(): Accent {
  return accent;
}

function paint(): void {
  const root = document.documentElement;
  const mode = resolvedMode();
  root.dataset.mode = mode;
  root.dataset.accent = accent;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', mode === 'dark' ? '#0b0c0e' : '#ffffff');
  window.dispatchEvent(new CustomEvent('themechange', { detail: { mode, accent } }));
}

export function setMode(next: ModePref): void {
  modePref = next;
  try {
    localStorage.setItem(MODE_KEY, next);
  } catch {
    /* storage blocked — theme still applies for this session */
  }
  paint();
}

export function setAccent(next: Accent): void {
  accent = next;
  try {
    localStorage.setItem(ACCENT_KEY, next);
  } catch {
    /* non-fatal */
  }
  paint();
}

export function toggleMode(): Mode {
  const next: Mode = resolvedMode() === 'dark' ? 'light' : 'dark';
  setMode(next);
  return next;
}

/**
 * Applies the stored theme. Called from an inline script before first
 * paint so there is no flash of the wrong mode.
 */
export function initTheme(): void {
  paint();
  media.addEventListener('change', () => {
    if (modePref === 'system') paint();
  });
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('theme-booting');
  });
}
