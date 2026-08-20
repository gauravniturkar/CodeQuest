import { SECTIONS, TOTAL_XP } from '../data/sections';
import type { Step } from '../data/types';

export interface GameState {
  playerName: string;
  score: number;
  totalXp: number;
  bestStreak: number;
  streak: number;
  xp: number;
  completed: Set<string>;
  /** Best percentage per section id, so the list can show real progress. */
  bestPct: Record<string, number>;
  currentSection: number | null;
  currentStep: number;
  stepResults: boolean[];
  questions: Step[];
}

const SAVE_KEY = 'cq.progress';

export const G: GameState = {
  playerName: 'Coder',
  score: 0,
  totalXp: 0,
  bestStreak: 0,
  streak: 0,
  xp: 0,
  completed: new Set<string>(),
  bestPct: {},
  currentSection: null,
  currentStep: 0,
  stepResults: [],
  questions: [],
};

interface Saved {
  playerName: string;
  score: number;
  totalXp: number;
  bestStreak: number;
  xp: number;
  completed: string[];
  bestPct: Record<string, number>;
}

export function save(): void {
  const payload: Saved = {
    playerName: G.playerName,
    score: G.score,
    totalXp: G.totalXp,
    bestStreak: G.bestStreak,
    xp: G.xp,
    completed: [...G.completed],
    bestPct: G.bestPct,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    /* progress simply won't persist */
  }
}

export function load(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as Partial<Saved>;
    G.playerName = s.playerName ?? G.playerName;
    G.score = s.score ?? 0;
    G.totalXp = s.totalXp ?? 0;
    G.bestStreak = s.bestStreak ?? 0;
    G.xp = Math.min(TOTAL_XP, s.xp ?? 0);
    G.completed = new Set(s.completed ?? []);
    G.bestPct = s.bestPct ?? {};
    return true;
  } catch {
    return false;
  }
}

export function reset(): void {
  G.score = 0;
  G.totalXp = 0;
  G.bestStreak = 0;
  G.streak = 0;
  G.xp = 0;
  G.completed = new Set();
  G.bestPct = {};
  G.currentSection = null;
  save();
}

/** A section unlocks once the one before it is complete. */
export function isLocked(index: number): boolean {
  if (index <= 0) return false;
  const prev = SECTIONS[index - 1];
  return !!prev && !G.completed.has(prev.id);
}

export function isDone(index: number): boolean {
  const sec = SECTIONS[index];
  return !!sec && G.completed.has(sec.id);
}

export function nextUnlockedIndex(): number {
  for (let i = 0; i < SECTIONS.length; i++) {
    if (!isLocked(i) && !isDone(i)) return i;
  }
  return 0;
}
