/** Terse typed helpers so view code stays about the view. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  html = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('data-') || k.startsWith('aria-')) node.setAttribute(k, v);
    else node.setAttribute(k, v);
  }
  if (html) node.innerHTML = html;
  return node;
}

export function $<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(sel);
}

export function $$<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

/** Escapes text destined for innerHTML. Question text comes from an LLM. */
export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Assigns --i to each child so `.stagger` can offset their delays. */
export function stagger(container: Element): void {
  Array.from(container.children).forEach((child, i) => {
    (child as HTMLElement).style.setProperty('--i', String(i));
  });
}

/** Tweens a number in the DOM — used for XP and score readouts. */
export function countTo(node: HTMLElement, to: number, duration = 700): void {
  const from = Number(node.dataset.value ?? node.textContent?.replace(/\D/g, '') ?? 0) || 0;
  node.dataset.value = String(to);
  if (from === to) { node.textContent = String(to); return; }
  if (prefersReducedMotion()) { node.textContent = String(to); return; }

  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = String(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Attaches a pointer-positioned ripple to a button. */
export function attachRipple(node: HTMLElement): void {
  node.classList.add('ripple');
  node.addEventListener('pointerdown', (e) => {
    if (prefersReducedMotion()) return;
    const rect = node.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const dot = document.createElement('span');
    dot.className = 'ripple-dot';
    dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    node.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  });
}
