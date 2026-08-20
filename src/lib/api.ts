import type { Section, Step } from '../data/types';

/** Signals whether the last AI call succeeded, so the UI can say so honestly. */
export let aiOnline: boolean | null = null;

export async function generateQuestions(section: Section): Promise<Step[] | null> {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionTitle: section.title,
        sectionDesc: section.desc,
        sectionId: section.id,
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as { questions?: Step[] };
    if (Array.isArray(data.questions) && data.questions.length >= 3) {
      aiOnline = true;
      return data.questions;
    }
    throw new Error('Malformed response');
  } catch (err) {
    aiOnline = false;
    console.warn('AI unavailable, falling back to the built-in bank:', err);
    return null;
  }
}

export async function getHint(
  question: string,
  section: string,
  fallbackHint: string,
): Promise<string> {
  try {
    const res = await fetch('/api/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, section, fallbackHint }),
    });
    if (!res.ok) return fallbackHint;
    const data = (await res.json()) as { hint?: string };
    return data.hint || fallbackHint;
  } catch {
    return fallbackHint;
  }
}
