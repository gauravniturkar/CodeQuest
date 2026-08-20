export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Section {
  id: string;
  icon: string;
  title: string;
  xp: number;
  desc: string;
  difficulty: Difficulty;
  topics: string[];
}

export interface LearnStep {
  type: 'learn';
  title: string;
  body: string;
  code?: string;
}

export interface QuizStep {
  type: 'quiz';
  q: string;
  opts: string[];
  answer: number;
  explain?: string;
  hint?: string;
  code?: string;
}

export interface FillStep {
  type: 'fill';
  q: string;
  answer: string;
  hint?: string;
  explain?: string;
  code?: string;
}

export type Step = LearnStep | QuizStep | FillStep;

export interface LeaderEntry {
  name: string;
  score: number;
  xp: number;
  sections: number;
  ts: number;
  /** Marks the seeded pace-setters so they are never passed off as real players. */
  bot?: boolean;
}
