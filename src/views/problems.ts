import { SECTIONS, TOTAL_XP } from '../data/sections';
import { $, $$, esc, stagger } from '../lib/dom';
import { G, isDone, isLocked } from '../lib/store';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function renderProblems(host: HTMLElement, onOpen: (index: number) => void): void {
  const solved = G.completed.size;
  const pctXp = Math.round((G.xp / TOTAL_XP) * 100);

  host.innerHTML = `
    <div class="view">
      <div class="page-head">
        <span class="eyebrow">Python track</span>
        <h1 class="page-title">${esc(greeting())}, ${esc(G.playerName)}.</h1>
        <p class="page-sub">
          Seven sections, each one a short set of AI-generated questions. Clear a section
          to unlock the next.
        </p>
      </div>

      <div class="stat-strip stagger" id="strip">
        <div class="stat"><div class="stat-val">${solved}<span class="mute" style="font-size:15px">/${SECTIONS.length}</span></div><div class="stat-label">Solved</div></div>
        <div class="stat"><div class="stat-val">${G.score}</div><div class="stat-label">Score</div></div>
        <div class="stat"><div class="stat-val">${G.bestStreak}</div><div class="stat-label">Best streak</div></div>
        <div class="stat"><div class="stat-val">${pctXp}<span class="mute" style="font-size:15px">%</span></div><div class="stat-label">XP earned</div></div>
      </div>

      <div class="table-wrap">
        <div class="table-head">
          <span>Status</span><span>Section</span><span>Difficulty</span><span>Best</span><span>XP</span>
        </div>
        <div id="rows"></div>
      </div>
    </div>`;

  const strip = $('#strip', host);
  if (strip) stagger(strip);

  const rows = $('#rows', host);
  if (!rows) return;

  rows.innerHTML = SECTIONS.map((sec, i) => {
    const locked = isLocked(i);
    const done = isDone(i);
    const best = G.bestPct[sec.id] ?? 0;
    const status = done ? '✓' : locked ? '🔒' : '○';

    return `
      <button class="row" type="button" data-index="${i}" ${locked ? 'disabled' : ''}
              aria-label="${esc(sec.title)}, ${locked ? 'locked' : done ? 'completed' : 'available'}">
        <span class="row-status${done ? ' done' : ''}" aria-hidden="true">${status}</span>
        <span class="row-title">
          <span style="min-width:0">
            <span style="display:flex;align-items:center;gap:8px">
              <span class="row-num">${String(i + 1).padStart(2, '0')}.</span>
              <span class="row-name">${esc(sec.icon)} ${esc(sec.title)}</span>
            </span>
            <span class="row-topics">${sec.topics.map((t) => `<span class="topic">${esc(t)}</span>`).join('')}</span>
          </span>
        </span>
        <span><span class="pill ${sec.difficulty.toLowerCase()}">${esc(sec.difficulty)}</span></span>
        <span class="row-progress">
          <span class="mini-bar"><span class="mini-fill" data-pct="${best}"></span></span>
          <span class="row-pct">${best}%</span>
        </span>
        <span class="row-xp">${sec.xp}</span>
      </button>`;
  }).join('');

  stagger(rows);
  rows.classList.add('stagger');

  requestAnimationFrame(() => {
    $$<HTMLElement>('.mini-fill', rows).forEach((f) => {
      f.style.width = `${f.dataset.pct}%`;
    });
  });

  $$<HTMLButtonElement>('.row', rows).forEach((row) => {
    if (row.disabled) return;
    row.addEventListener('click', () => onOpen(Number(row.dataset.index)));
  });
}
