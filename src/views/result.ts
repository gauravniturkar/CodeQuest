import { SECTIONS, TOTAL_XP } from '../data/sections';
import { $, attachRipple, esc, stagger } from '../lib/dom';
import { G, save } from '../lib/store';
import { saveScore } from '../lib/storage';
import { burst } from '../ui/confetti';
import { toast } from '../ui/toast';
import { refreshBoard, renderSidebar, updateHUD, updateStats } from './shell';

export interface ResultHooks {
  onNext: (index: number) => void;
  onExit: () => void;
  onPick: (index: number) => void;
}

export function renderResult(host: HTMLElement, hooks: ResultHooks): void {
  const index = G.currentSection ?? 0;
  const sec = SECTIONS[index];
  if (!sec) return;

  const hits = G.stepResults.filter(Boolean).length;
  const total = G.stepResults.length || 1;
  const pct = Math.round((hits / total) * 100);
  const xpEarned = Math.round(sec.xp * (pct / 100));

  G.xp = Math.min(TOTAL_XP, G.xp + xpEarned);
  G.totalXp += xpEarned;
  G.completed.add(sec.id);
  G.bestPct[sec.id] = Math.max(G.bestPct[sec.id] ?? 0, pct);
  save();

  const icon = pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '😊' : '💪';
  const title = pct === 100 ? 'Perfect run' : pct >= 80 ? 'Strong finish' : 'Section complete';
  const note =
    pct === 100
      ? 'Flawless — every question correct.'
      : pct >= 80
        ? `${hits} of ${total} correct. Nicely done.`
        : `${hits} of ${total} correct. Worth another pass to lock it in.`;

  const hasNext = index + 1 < SECTIONS.length;

  host.innerHTML = `
    <div class="view">
      <div class="card result">
        <div class="result-icon" aria-hidden="true">${icon}</div>
        <h1 style="font-size:var(--text-xl)">${esc(title)}</h1>
        <div class="result-score">${pct}%</div>
        <p class="dim">${esc(note)}</p>
        <div class="result-breakdown" id="breakdown" aria-label="Per-question results">
          ${G.stepResults
            .map(
              (ok, i) =>
                `<span class="rb-dot ${ok ? 'hit' : 'miss'}" title="Question ${i + 1}">${ok ? '✓' : '✗'}</span>`,
            )
            .join('')}
        </div>
        <div class="result-xp"><span aria-hidden="true">✦</span> +${xpEarned} XP</div>
        <div class="actions" style="justify-content:center">
          <button class="btn btn-ghost" id="rs-back">All sections</button>
          ${hasNext ? `<button class="btn btn-primary" id="rs-next">Next section →</button>` : ''}
        </div>
      </div>
    </div>`;

  const breakdown = $('#breakdown', host);
  if (breakdown) stagger(breakdown);

  const back = $('#rs-back', host);
  if (back) { attachRipple(back); back.addEventListener('click', hooks.onExit); }

  const next = $('#rs-next', host);
  if (next) {
    attachRipple(next);
    next.addEventListener('click', () => hooks.onNext(index + 1));
  }

  updateHUD();
  updateStats();
  renderSidebar(hooks.onPick);

  if (pct === 100) burst();

  void saveScore({
    name: G.playerName,
    score: G.score,
    xp: G.totalXp,
    sections: G.completed.size,
    ts: Date.now(),
  }).then((written) => {
    if (written) {
      toast('New personal best saved', '🏅');
      void refreshBoard();
    }
  });
}
