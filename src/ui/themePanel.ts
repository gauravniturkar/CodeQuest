import { $$, el, esc } from '../lib/dom';
import { ACCENTS, getAccent, getModePref, setAccent, setMode } from '../lib/theme';
import type { Accent, ModePref } from '../lib/theme';

/** Swatch preview pairs, matched to the hue/saturation in tokens.css. */
const PREVIEW: Record<Accent, [string, string]> = {
  citrus: ['hsl(72 92% 62%)', 'hsl(88 80% 40%)'],
  ember: ['hsl(18 88% 60%)', 'hsl(2 82% 46%)'],
  ocean: ['hsl(199 90% 58%)', 'hsl(215 85% 44%)'],
  violet: ['hsl(265 82% 64%)', 'hsl(288 70% 46%)'],
  mono: ['hsl(220 0% 74%)', 'hsl(220 0% 26%)'],
};

const MODES: { id: ModePref; label: string; icon: string }[] = [
  { id: 'light', label: 'Light', icon: '☀' },
  { id: 'dark', label: 'Dark', icon: '☾' },
  { id: 'system', label: 'Auto', icon: '◐' },
];

let panel: HTMLElement | null = null;

function sync(): void {
  if (!panel) return;
  const mode = getModePref();
  const accent = getAccent();
  $$('[data-mode-btn]', panel).forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.modeBtn === mode));
  });
  $$('[data-accent-btn]', panel).forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.accentBtn === accent));
  });
}

function build(): HTMLElement {
  const node = el('div', { class: 'popover', role: 'dialog', 'aria-label': 'Appearance' });
  node.hidden = true;
  node.innerHTML = `
    <div class="pop-label">Mode</div>
    <div class="seg-control">
      ${MODES.map(
        (m) => `<button type="button" data-mode-btn="${m.id}" aria-pressed="false">
                  <span aria-hidden="true">${m.icon}</span>${esc(m.label)}
                </button>`,
      ).join('')}
    </div>
    <div class="pop-label">Accent</div>
    <div class="swatches">
      ${ACCENTS.map((a) => {
        const [c1, c2] = PREVIEW[a.id];
        return `<div>
                  <button type="button" class="swatch" data-accent-btn="${a.id}"
                          title="${esc(a.note)}" aria-label="${esc(a.label)} accent" aria-pressed="false"
                          style="--sw-a:${c1};--sw-b:${c2}"><i></i></button>
                  <div class="swatch-name">${esc(a.label)}</div>
                </div>`;
      }).join('')}
    </div>`;

  $$('[data-mode-btn]', node).forEach((b) => {
    b.addEventListener('click', () => {
      setMode(b.dataset.modeBtn as ModePref);
      sync();
    });
  });
  $$('[data-accent-btn]', node).forEach((b) => {
    b.addEventListener('click', () => {
      setAccent(b.dataset.accentBtn as Accent);
      sync();
    });
  });

  return node;
}

export function mountThemePanel(host: HTMLElement, trigger: HTMLElement): void {
  panel = build();
  host.appendChild(panel);
  sync();

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    panel!.hidden = !panel!.hidden;
    trigger.setAttribute('aria-expanded', String(!panel!.hidden));
    if (!panel!.hidden) sync();
  });

  document.addEventListener('pointerdown', (e) => {
    if (!panel || panel.hidden) return;
    if (panel.contains(e.target as Node) || trigger.contains(e.target as Node)) return;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel && !panel.hidden) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });

  window.addEventListener('themechange', sync);
}

export function closeThemePanel(): void {
  if (panel) panel.hidden = true;
}

