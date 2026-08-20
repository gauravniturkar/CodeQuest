import { el, esc, prefersReducedMotion } from '../lib/dom';

let layer: HTMLElement | null = null;

function ensureLayer(): HTMLElement {
  if (!layer) {
    layer = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(layer);
  }
  return layer;
}

export function toast(message: string, icon = '✦', ms = 2600): void {
  const node = el('div', { class: 'toast' });
  node.innerHTML = `<span class="toast-icon">${esc(icon)}</span><span>${esc(message)}</span>`;
  ensureLayer().appendChild(node);

  window.setTimeout(() => {
    if (prefersReducedMotion()) { node.remove(); return; }
    node.classList.add('out');
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }, ms);
}
