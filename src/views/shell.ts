import { SECTIONS, TOTAL_XP } from '../data/sections';
import type { LeaderEntry } from '../data/types';
import { $, countTo, el, esc, stagger } from '../lib/dom';
import { loadBoard } from '../lib/storage';
import { G, isDone, isLocked } from '../lib/store';

const RING_CIRCUMFERENCE = 2 * Math.PI * 13.5;

/** Called by every view that changes a number in the chrome. */
export function updateHUD(): void {
  const streak = $('#hud-streak');
  const score = $('#hud-score');
  if (streak) countTo(streak, G.streak, 350);
  if (score) countTo(score, G.score, 500);

  const pct = TOTAL_XP ? G.xp / TOTAL_XP : 0;
  const arc = $<SVGCircleElement>('#xp-arc');
  if (arc) arc.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct));
  const label = $('#xp-pct');
  if (label) label.textContent = `${Math.round(pct * 100)}`;

  const ring = $('#xp-ring');
  ring?.setAttribute('aria-label', `${G.xp} of ${TOTAL_XP} XP`);

  $('#chip-streak')?.classList.toggle('hot', G.streak >= 3);

  const avatar = $('#avatar');
  if (avatar) {
    avatar.textContent = G.playerName.charAt(0).toUpperCase() || 'C';
    avatar.title = G.playerName;
  }
}

/** A short bump so a changing number is noticed without a full animation. */
export function bumpChip(id: string): void {
  const chip = $(`#${id}`);
  if (!chip) return;
  chip.classList.remove('bump');
  void chip.offsetWidth;
  chip.classList.add('bump');
}

export function renderSidebar(onPick: (index: number) => void): void {
  const sb = $('#sidebar');
  if (!sb) return;

  const completedPct = Math.round((G.completed.size / SECTIONS.length) * 100);

  sb.innerHTML = `
    <div class="track-card">
      <div class="track-top">
        <span class="track-title">Python Track</span>
        <span class="track-pct">${G.completed.size}/${SECTIONS.length}</span>
      </div>
      <div class="bar"><div class="bar-fill" id="track-fill"></div></div>
    </div>
    <div class="side-label"><span>Sections</span><span>${completedPct}%</span></div>
    <div class="side-list" id="side-list"></div>`;

  requestAnimationFrame(() => {
    const fill = $<HTMLElement>('#track-fill');
    if (fill) fill.style.width = `${completedPct}%`;
  });

  const list = $('#side-list');
  if (!list) return;
  list.className = 'side-list stagger';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '2px';

  SECTIONS.forEach((sec, i) => {
    const locked = isLocked(i);
    const done = isDone(i);
    const btn = el('button', {
      class: 'side-item',
      type: 'button',
      'aria-current': String(G.currentSection === i),
    });
    btn.innerHTML = `
      <span class="side-icon" aria-hidden="true">${esc(sec.icon)}</span>
      <span class="side-body">
        <span class="side-name">${esc(sec.title)}</span>
        <span class="side-meta">${esc(sec.difficulty)} · ${sec.xp} XP</span>
      </span>
      <span class="side-state${done ? ' done' : ''}" aria-hidden="true">${done ? '✓' : locked ? '🔒' : ''}</span>`;

    if (locked) {
      btn.disabled = true;
      btn.setAttribute('aria-label', `${sec.title}, locked`);
    } else {
      btn.addEventListener('click', () => {
        onPick(i);
        closeMobileSidebar();
      });
    }
    list.appendChild(btn);
  });

  stagger(list);
}

export function closeMobileSidebar(): void {
  $('#sidebar')?.classList.remove('open');
  $('#menu-btn')?.setAttribute('aria-expanded', 'false');
}

export function toggleMobileSidebar(): void {
  const sb = $('#sidebar');
  if (!sb) return;
  const open = sb.classList.toggle('open');
  $('#menu-btn')?.setAttribute('aria-expanded', String(open));
}

const MEDALS = ['g', 's', 'b'];
const AVATARS = ['🏆', '⚡', '🚀', '🎯', '✨', '💎', '🔥', '⭐'];

export async function renderRail(): Promise<void> {
  const rail = $('#rail');
  if (!rail) return;

  rail.innerHTML = `
    <section>
      <div class="rail-head">
        <span class="rail-title"><span aria-hidden="true">🏅</span> Leaderboard</span>
        <span class="rail-note">Top 12</span>
      </div>
      <div class="lb-list" id="lb-list">
        ${Array.from({ length: 5 })
          .map(() => `<div class="lb-row"><div class="skeleton" style="height:28px;grid-column:1/-1"></div></div>`)
          .join('')}
      </div>
    </section>
    <section>
      <div class="rail-head"><span class="rail-title"><span aria-hidden="true">📈</span> Your stats</span></div>
      <div class="stat-strip" style="grid-template-columns:repeat(2,1fr);margin:0">
        <div class="stat"><div class="stat-val" id="stat-score">0</div><div class="stat-label">Score</div></div>
        <div class="stat"><div class="stat-val" id="stat-streak">0</div><div class="stat-label">Best streak</div></div>
        <div class="stat"><div class="stat-val" id="stat-sections">0</div><div class="stat-label">Sections</div></div>
        <div class="stat"><div class="stat-val" id="stat-xp">0</div><div class="stat-label">Total XP</div></div>
      </div>
    </section>`;

  updateStats();
  renderBoard(await loadBoard());
}

export function updateStats(): void {
  const set = (id: string, v: number) => {
    const node = $(`#${id}`);
    if (node) countTo(node, v);
  };
  set('stat-score', G.score);
  set('stat-streak', G.bestStreak);
  set('stat-sections', G.completed.size);
  set('stat-xp', G.totalXp);
}

export function renderBoard(entries: LeaderEntry[]): void {
  const list = $('#lb-list');
  if (!list) return;

  if (!entries.length) {
    list.innerHTML = `<div class="empty">No scores yet. Finish a section to claim the top spot.</div>`;
    return;
  }

  list.innerHTML = entries
    .slice(0, 12)
    .map((e, i) => {
      const self = !e.bot && e.name === G.playerName;
      return `
        <div class="lb-row${self ? ' self' : ''}"${self ? ' id="lb-self"' : ''}>
          <span class="lb-rank ${MEDALS[i] ?? ''}">${String(i + 1).padStart(2, '0')}</span>
          <span class="lb-avatar" aria-hidden="true">${AVATARS[i % AVATARS.length]}</span>
          <span>
            <span class="lb-name">${esc(e.name)}${self ? ' (you)' : ''}${
              e.bot ? '<span class="tag-bot">BOT</span>' : ''
            }</span>
            <span class="lb-meta">${e.sections ?? 0} sections · ${e.xp ?? 0} XP</span>
          </span>
          <span class="lb-score">${e.score}</span>
        </div>`;
    })
    .join('');

  stagger(list);
  list.classList.add('stagger');
}

export async function refreshBoard(): Promise<void> {
  renderBoard(await loadBoard());
}
