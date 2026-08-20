import type { LeaderEntry } from '../data/types';

/**
 * The original build wrote scores through window.storage, which only exists
 * inside the Claude artifact host. Anywhere else that silently failed and the
 * board stayed empty, so this falls back to localStorage.
 */
interface HostStorage {
  get(key: string, global?: boolean): Promise<{ value: string } | null>;
  set(key: string, value: string, global?: boolean): Promise<void>;
  list(prefix: string, global?: boolean): Promise<{ keys: string[] }>;
}

const host = (window as unknown as { storage?: HostStorage }).storage;
const PREFIX = 'cq_score:';

/** Pace-setters shown when the board would otherwise be empty. Flagged as bots. */
const PACE_SETTERS: LeaderEntry[] = [
  { name: 'byte.wanderer', score: 640, xp: 1180, sections: 7, ts: 0, bot: true },
  { name: 'nullptr_nova', score: 520, xp: 940, sections: 6, ts: 0, bot: true },
  { name: 'recursor', score: 430, xp: 810, sections: 5, ts: 0, bot: true },
  { name: 'lambda_lark', score: 310, xp: 600, sections: 4, ts: 0, bot: true },
  { name: 'stackful', score: 180, xp: 400, sections: 3, ts: 0, bot: true },
];

function localEntries(): LeaderEntry[] {
  const out: LeaderEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (raw) out.push(JSON.parse(raw) as LeaderEntry);
    }
  } catch {
    /* storage blocked — fall through to pace-setters only */
  }
  return out;
}

export async function loadBoard(): Promise<LeaderEntry[]> {
  let entries: LeaderEntry[] = [];

  if (host) {
    try {
      const { keys } = await host.list(PREFIX, true);
      for (const key of (keys ?? []).slice(0, 40)) {
        try {
          const rec = await host.get(key, true);
          if (rec?.value) entries.push(JSON.parse(rec.value) as LeaderEntry);
        } catch {
          /* skip unreadable rows rather than failing the whole board */
        }
      }
    } catch {
      entries = [];
    }
  }

  if (!entries.length) entries = localEntries();

  return [...entries, ...PACE_SETTERS].sort((a, b) => b.score - a.score);
}

export async function saveScore(entry: LeaderEntry): Promise<boolean> {
  if (entry.name === 'Guest' || !entry.score) return false;
  const key = `${PREFIX}${entry.name.toLowerCase().replace(/\s+/g, '_')}`;

  const readPrev = async (): Promise<LeaderEntry | null> => {
    if (host) {
      const rec = await host.get(key, true).catch(() => null);
      return rec?.value ? (JSON.parse(rec.value) as LeaderEntry) : null;
    }
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LeaderEntry) : null;
  };

  try {
    const prev = await readPrev();
    if (prev && prev.score >= entry.score) return false;
    const payload = JSON.stringify(entry);
    if (host) await host.set(key, payload, true);
    else localStorage.setItem(key, payload);
    return true;
  } catch {
    return false;
  }
}
