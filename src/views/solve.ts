import { SECTIONS } from '../data/sections';
import { FALLBACK_QUESTIONS } from '../data/fallback';
import type { QuizStep, FillStep, Step } from '../data/types';
import { $, $$, attachRipple, esc } from '../lib/dom';
import { codeBlock } from '../lib/highlight';
import { generateQuestions, getHint } from '../lib/api';
import { G, save } from '../lib/store';
import { bumpChip, renderSidebar, updateHUD } from './shell';
import { toast } from '../ui/toast';

export interface SolveHooks {
  onFinish: () => void;
  onExit: () => void;
  onPick: (index: number) => void;
}

let host: HTMLElement | null = null;
let hooks: SolveHooks | null = null;
let answered = false;

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export async function startSection(
  container: HTMLElement,
  index: number,
  h: SolveHooks,
): Promise<void> {
  host = container;
  hooks = h;
  const sec = SECTIONS[index];
  if (!sec) return;

  G.currentSection = index;
  G.currentStep = 0;
  G.stepResults = [];
  G.questions = [];

  renderFrame(sec.icon, sec.title);
  renderLoading(sec.title);
  renderSidebar(h.onPick);

  const generated = await generateQuestions(sec);

  // The section may have been abandoned while the request was in flight.
  if (G.currentSection !== index) return;

  G.questions = generated ?? FALLBACK_QUESTIONS[sec.id] ?? FALLBACK_QUESTIONS.variables ?? [];
  if (!generated) toast('Offline question bank in use', '📚');

  buildTrack();
  renderStep();
}

function renderFrame(icon: string, title: string): void {
  if (!host) return;
  host.innerHTML = `
    <div class="view solve">
      <div class="solve-head">
        <button class="icon-btn" id="solve-back" aria-label="Back to problems">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <span class="solve-title"><span aria-hidden="true">${esc(icon)}</span>${esc(title)}</span>
        <span style="flex:1"></span>
        <div class="step-track" id="track" aria-hidden="true"></div>
        <span class="rail-note mono" id="step-count"></span>
      </div>
      <div class="card" id="q-card"></div>
    </div>`;

  $('#solve-back', host)?.addEventListener('click', () => hooks?.onExit());
}

function renderLoading(title: string): void {
  const card = $('#q-card');
  if (!card) return;
  card.innerHTML = `
    <div class="ai-load">
      <div class="ai-load-head">
        <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Claude is writing fresh questions for <strong>${esc(title)}</strong>…</span>
      </div>
      <div class="skeleton" style="height:26px;width:70%"></div>
      <div class="skeleton" style="height:15px;width:92%"></div>
      <div class="skeleton" style="height:44px;margin-top:12px"></div>
      <div class="skeleton" style="height:44px"></div>
      <div class="skeleton" style="height:44px"></div>
    </div>`;
}

function buildTrack(): void {
  const track = $('#track');
  if (!track) return;
  track.innerHTML = G.questions.map(() => `<span class="seg"></span>`).join('');
  updateTrack();
}

function updateTrack(): void {
  $$('.seg').forEach((seg, i) => {
    seg.className = `seg${i < G.currentStep ? ' done' : i === G.currentStep ? ' current' : ''}`;
  });
  const count = $('#step-count');
  if (count) count.textContent = `${Math.min(G.currentStep + 1, G.questions.length)}/${G.questions.length}`;
}

/** Normalises the two shapes the model has been seen to return. */
function normalise(step: Step): Step {
  const raw = step as unknown as Record<string, unknown>;
  if (step.type === 'quiz') {
    return {
      ...step,
      q: (raw.q ?? raw.question ?? '') as string,
      opts: (raw.opts ?? raw.options ?? []) as string[],
      answer: Number(raw.answer ?? raw.correct ?? 0),
    };
  }
  if (step.type === 'fill') {
    return { ...step, q: (raw.q ?? raw.question ?? '') as string };
  }
  return step;
}

function renderStep(): void {
  answered = false;
  updateTrack();

  const card = $('#q-card');
  const step = G.questions[G.currentStep];
  if (!card || !step) return;

  const q = normalise(step);
  card.classList.remove('anim-fade-up');
  void card.offsetWidth;
  card.classList.add('anim-fade-up');

  if (q.type === 'learn') renderLearn(card, q.title, q.body, q.code);
  else if (q.type === 'quiz') renderQuiz(card, q);
  else renderFill(card, q);
}

function renderLearn(card: HTMLElement, title: string, body: string, code?: string): void {
  card.innerHTML = `
    <span class="q-badge"><span aria-hidden="true">📖</span> Concept</span>
    <h2 class="q-text">${esc(title)}</h2>
    <p class="q-body">${esc(body)}</p>
    ${code ? codeBlock(code) : ''}
    <div class="actions">
      <button class="btn btn-primary" id="continue">Got it, continue →</button>
      <span class="rail-note">or press <kbd>↵</kbd></span>
    </div>`;
  wire($('#continue', card), () => nextStep(true));
}

function renderQuiz(card: HTMLElement, q: QuizStep): void {
  card.innerHTML = `
    <span class="q-badge"><span aria-hidden="true">🎯</span> Multiple choice</span>
    <h2 class="q-text">${esc(q.q)}</h2>
    ${q.code ? codeBlock(q.code) : ''}
    <div class="options" id="options" role="group" aria-label="Answer options">
      ${q.opts
        .map(
          (opt, i) => `
        <button class="option" type="button" data-index="${i}">
          <span class="option-key" aria-hidden="true">${LETTERS[i] ?? i + 1}</span>
          <span>${esc(opt)}</span>
        </button>`,
        )
        .join('')}
    </div>
    <div id="feedback"></div>
    <div id="after" hidden></div>`;

  $$<HTMLButtonElement>('.option', card).forEach((btn) => {
    attachRipple(btn);
    btn.addEventListener('click', () => answerQuiz(Number(btn.dataset.index), q));
  });
}

function renderFill(card: HTMLElement, q: FillStep): void {
  card.innerHTML = `
    <span class="q-badge"><span aria-hidden="true">✏️</span> Type the answer</span>
    <h2 class="q-text">${esc(q.q)}</h2>
    ${q.code ? codeBlock(q.code) : ''}
    <div class="fill-row">
      <input class="input" id="fill" placeholder="Type your answer…" autocomplete="off" spellcheck="false" aria-label="Your answer" />
      <button class="btn btn-primary" id="check">Check</button>
    </div>
    <div id="feedback"></div>
    <div id="after" hidden></div>`;

  const input = $<HTMLInputElement>('#fill', card);
  wire($('#check', card), () => answerFill(q));
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !answered) answerFill(q);
  });
  input?.focus();
}

function wire(node: HTMLElement | null, fn: () => void): void {
  if (!node) return;
  attachRipple(node);
  node.addEventListener('click', fn);
}

function answerQuiz(picked: number, q: QuizStep): void {
  if (answered) return;
  answered = true;

  const correct = picked === q.answer;
  $$<HTMLButtonElement>('.option').forEach((b) => (b.disabled = true));
  $(`.option[data-index="${q.answer}"]`)?.classList.add('correct');
  if (!correct) $(`.option[data-index="${picked}"]`)?.classList.add('wrong');

  showFeedback(correct, q.explain ?? (correct ? 'Correct.' : `The answer was ${q.opts[q.answer] ?? '—'}.`));
  record(correct, q.q, q.hint);
}

function answerFill(q: FillStep): void {
  if (answered) return;
  const input = $<HTMLInputElement>('#fill');
  if (!input || !input.value.trim()) return;
  answered = true;

  const clean = (s: string) => s.trim().toLowerCase().replace(/['"]/g, '');
  const given = clean(input.value);
  const want = clean(String(q.answer));
  const correct = given === want || given.replace(/\s/g, '') === want.replace(/\s/g, '');

  input.classList.add(correct ? 'correct' : 'wrong');
  input.disabled = true;
  const check = $<HTMLButtonElement>('#check');
  if (check) check.disabled = true;

  showFeedback(correct, q.explain ?? (correct ? 'Correct.' : `The answer was: ${q.answer}`));
  record(correct, q.q, q.hint);
}

function showFeedback(correct: boolean, message: string): void {
  const area = $('#feedback');
  if (!area) return;
  area.innerHTML = `
    <div class="feedback ${correct ? 'correct' : 'wrong'}">
      <span class="feedback-icon" aria-hidden="true">${correct ? '✓' : '✗'}</span>
      <span class="feedback-text">${esc(message)}</span>
    </div>`;
}

function record(correct: boolean, question: string, hint?: string): void {
  G.stepResults.push(correct);

  if (correct) {
    G.streak += 1;
    G.bestStreak = Math.max(G.bestStreak, G.streak);
    G.score += 10 * (G.streak >= 3 ? 2 : 1);
    if (G.streak >= 3) showCombo();
    bumpChip('chip-score');
  } else {
    G.streak = 0;
  }

  updateHUD();
  save();
  showAfterActions(question, hint);
}

function showAfterActions(question: string, hint?: string): void {
  const after = $('#after');
  if (!after) return;
  after.hidden = false;
  after.innerHTML = `
    <div class="actions">
      <button class="btn btn-primary" id="continue">Continue →</button>
      <button class="btn btn-quiet" id="hint-btn"><span aria-hidden="true">💡</span> Hint</button>
      <span class="spacer"></span>
      <span class="rail-note">press <kbd>↵</kbd></span>
    </div>`;

  wire($('#continue', after), () => nextStep());
  wire($('#hint-btn', after), () => void revealHint(question, hint));
}

function nextStep(free = false): void {
  if (free) G.stepResults.push(true);
  G.currentStep += 1;
  if (G.currentStep >= G.questions.length) hooks?.onFinish();
  else renderStep();
}

function showCombo(): void {
  const combo = $('#combo');
  if (!combo) return;
  combo.textContent = `🔥 Combo ×${G.streak}`;
  combo.classList.add('show');
  window.setTimeout(() => combo.classList.remove('show'), 1500);
}

async function revealHint(question: string, fallback?: string): Promise<void> {
  const drawer = $('#hint');
  const body = $('#hint-body');
  if (!drawer || !body) return;

  const fallbackHint = fallback ?? 'Re-read the question and ask what Python does step by step.';
  body.textContent = 'Thinking…';
  drawer.classList.add('show');

  const section = G.currentSection !== null ? (SECTIONS[G.currentSection]?.title ?? '') : '';
  body.textContent = await getHint(question, section, fallbackHint);

  window.setTimeout(() => drawer.classList.remove('show'), 7000);
}

/** Keyboard answering, wired once from the app entry. */
export function handleSolveKey(e: KeyboardEvent): boolean {
  const step = G.questions[G.currentStep];
  if (!step) return false;

  if (e.key === 'Enter') {
    const cont = $<HTMLButtonElement>('#continue');
    if (cont) { cont.click(); return true; }
    return false;
  }

  if (answered || step.type !== 'quiz') return false;

  const index = /^[1-5]$/.test(e.key)
    ? Number(e.key) - 1
    : LETTERS.indexOf(e.key.toUpperCase());
  if (index < 0) return false;

  const btn = $<HTMLButtonElement>(`.option[data-index="${index}"]`);
  if (!btn || btn.disabled) return false;
  btn.click();
  return true;
}
