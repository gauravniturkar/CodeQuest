import { $, $$, el, esc } from '../lib/dom';

export interface Command {
  id: string;
  label: string;
  icon: string;
  hint?: string;
  keywords?: string;
  run: () => void;
}

let commands: Command[] = [];
let scrim: HTMLElement | null = null;
let input: HTMLInputElement | null = null;
let list: HTMLElement | null = null;
let active = 0;
let filtered: Command[] = [];

export function registerCommands(cmds: Command[]): void {
  commands = cmds;
}

function build(): void {
  scrim = el('div', { class: 'scrim', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Command palette' });
  scrim.hidden = true;
  scrim.innerHTML = `
    <div class="palette">
      <input class="palette-input" type="text" placeholder="Jump to a section, switch theme, reset progress…" autocomplete="off" spellcheck="false" />
      <div class="palette-list" role="listbox"></div>
    </div>`;
  document.body.appendChild(scrim);

  input = $<HTMLInputElement>('.palette-input', scrim);
  list = $('.palette-list', scrim);

  scrim.addEventListener('pointerdown', (e) => {
    if (e.target === scrim) close();
  });
  input?.addEventListener('input', () => {
    active = 0;
    render();
  });
  input?.addEventListener('keydown', onKey);
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    active = Math.min(active + 1, filtered.length - 1);
    render();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    active = Math.max(active - 1, 0);
    render();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const cmd = filtered[active];
    if (cmd) { close(); cmd.run(); }
  } else if (e.key === 'Escape') {
    close();
  }
}

function render(): void {
  if (!list || !input) return;
  const q = input.value.trim().toLowerCase();
  filtered = q
    ? commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q))
    : commands;

  if (!filtered.length) {
    list.innerHTML = `<div class="palette-empty">No matching command</div>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (c, i) => `
      <button class="palette-item" role="option" data-index="${i}"
              aria-selected="${i === active}" data-active="${i === active}">
        <span class="pi-icon">${esc(c.icon)}</span>
        <span>${esc(c.label)}</span>
        ${c.hint ? `<span class="pi-hint">${esc(c.hint)}</span>` : ''}
      </button>`,
    )
    .join('');

  $$('.palette-item', list).forEach((node) => {
    node.addEventListener('click', () => {
      const cmd = filtered[Number(node.dataset.index)];
      close();
      cmd?.run();
    });
    node.addEventListener('pointerenter', () => {
      active = Number(node.dataset.index);
      $$('.palette-item', list!).forEach((n) => {
        n.dataset.active = String(Number(n.dataset.index) === active);
      });
    });
  });

  list.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
}

export function open(): void {
  if (!scrim) build();
  if (!scrim || !input) return;
  scrim.hidden = false;
  input.value = '';
  active = 0;
  render();
  input.focus();
}

export function close(): void {
  if (scrim) scrim.hidden = true;
}

export function isOpen(): boolean {
  return !!scrim && !scrim.hidden;
}

export function toggle(): void {
  isOpen() ? close() : open();
}
