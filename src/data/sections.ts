import type { Section } from './types';

export const SECTIONS: Section[] = [
  {
    id: 'variables', icon: '📦', title: 'Variables', xp: 100, difficulty: 'Easy',
    desc: 'Data types, assignment, naming, type conversion',
    topics: ['str', 'int', 'float', 'type()'],
  },
  {
    id: 'functions', icon: '⚙️', title: 'Functions', xp: 150, difficulty: 'Easy',
    desc: 'def, return, parameters, scope, lambda',
    topics: ['def', 'return', 'scope', 'lambda'],
  },
  {
    id: 'loops', icon: '🔁', title: 'Loops', xp: 150, difficulty: 'Easy',
    desc: 'for, while, break, continue, enumerate',
    topics: ['for', 'while', 'range', 'enumerate'],
  },
  {
    id: 'conditionals', icon: '🔀', title: 'Conditionals', xp: 150, difficulty: 'Easy',
    desc: 'if/elif/else, comparison & logical operators',
    topics: ['if', 'elif', 'and/or', 'not'],
  },
  {
    id: 'lists', icon: '📋', title: 'Lists', xp: 200, difficulty: 'Medium',
    desc: 'Indexing, slicing, methods, comprehensions',
    topics: ['index', 'slice', 'append', 'comprehension'],
  },
  {
    id: 'oop', icon: '🏗️', title: 'OOP', xp: 250, difficulty: 'Medium',
    desc: 'Classes, __init__, methods, inheritance',
    topics: ['class', '__init__', 'self', 'inherit'],
  },
  {
    id: 'apis', icon: '🌐', title: 'APIs', xp: 300, difficulty: 'Hard',
    desc: 'requests, JSON, status codes, REST, HTTP',
    topics: ['requests', 'json', 'status', 'REST'],
  },
];

export const TOTAL_XP = SECTIONS.reduce((sum, s) => sum + s.xp, 0);

export const sectionIndex = (id: string): number => SECTIONS.findIndex((s) => s.id === id);
