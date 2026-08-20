import type { LeaderEntry } from '../data/types';
import { $, esc, stagger } from '../lib/dom';
import { loadBoard } from '../lib/storage';
import { G } from '../lib/store';

const MEDALS = ['g', 's', 'b'];
const AVATARS = ['🏆', '⚡', '🚀', '🎯', '✨', '💎', '🔥', '⭐'];

export async function renderBoardPage(host: HTMLElement): Promise<void> {
  host.innerHTML = `
    <div class="view">
      <div class="page-head">
        <span class="eyebrow">Standings</span>
        <h1 class="page-title">Leaderboard</h1>
        <p class="page-sub">
          Your best run is saved on this device. Entries marked BOT are built-in
          pace-setters, not other players.
        </p>
      </div>
      <div class="table-wrap"><div id="board-rows" style="padding:var(--sp-2)">
        ${Array.from({ length: 6 })
          .map(() => `<div class="lb-row"><div class="skeleton" style="height:32px;grid-column:1/-1"></div></div>`)
          .join('')}
      </div></div>
    </div>`;

  paint(await loadBoard());
}

function paint(entries: LeaderEntry[]): void {
  const rows = $('#board-rows');
  if (!rows) return;

  if (!entries.length) {
    rows.innerHTML = `<div class="empty">No scores recorded yet.</div>`;
    return;
  }

  rows.innerHTML = entries
    .map((e, i) => {
      const self = !e.bot && e.name === G.playerName;
      return `
        <div class="lb-row${self ? ' self' : ''}" style="grid-template-columns:34px 30px minmax(0,1fr) auto;padding:var(--sp-3)">
          <span class="lb-rank ${MEDALS[i] ?? ''}">${String(i + 1).padStart(2, '0')}</span>
          <span class="lb-avatar" aria-hidden="true">${AVATARS[i % AVATARS.length]}</span>
          <span>
            <span class="lb-name">${esc(e.name)}${self ? ' (you)' : ''}${
              e.bot ? '<span class="tag-bot">BOT</span>' : ''
            }</span>
            <span class="lb-meta">${e.sections ?? 0} sections cleared · ${e.xp ?? 0} XP</span>
          </span>
          <span class="lb-score">${e.score}</span>
        </div>`;
    })
    .join('');

  stagger(rows);
  rows.classList.add('stagger');
}
