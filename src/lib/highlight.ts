import { esc } from './dom';

const KEYWORDS = new Set([
  'and','as','assert','async','await','break','class','continue','def','del','elif','else',
  'except','False','finally','for','from','global','if','import','in','is','lambda','None',
  'nonlocal','not','or','pass','raise','return','True','try','while','with','yield',
]);

const BUILTINS = new Set([
  'print','len','range','type','int','str','float','list','dict','set','tuple','bool',
  'sorted','sum','min','max','abs','enumerate','zip','map','filter','input','open','round',
]);

/**
 * A deliberately small Python highlighter. Code arrives either from the
 * bundled question bank or from the model, so it must never execute or
 * trust its input — every token is escaped on the way out.
 */
export function highlightPython(source: string): string {
  const tokens = source.match(
    /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\.?\d*\b)|(\b[A-Za-z_]\w*\b)|(\s+)|([\s\S])/g,
  );
  if (!tokens) return esc(source);

  let out = '';
  let prevWord = '';
  for (const t of tokens) {
    if (t.startsWith('#')) {
      out += `<span class="sx-cm">${esc(t)}</span>`;
    } else if (/^["']/.test(t)) {
      out += `<span class="sx-str">${esc(t)}</span>`;
    } else if (/^\d/.test(t)) {
      out += `<span class="sx-num">${esc(t)}</span>`;
    } else if (/^[A-Za-z_]/.test(t)) {
      if (KEYWORDS.has(t)) out += `<span class="sx-kw">${esc(t)}</span>`;
      else if (BUILTINS.has(t) || prevWord === 'def' || prevWord === 'class')
        out += `<span class="sx-fn">${esc(t)}</span>`;
      else out += `<span class="sx-var">${esc(t)}</span>`;
      prevWord = t;
    } else {
      out += esc(t);
      if (t.trim()) prevWord = '';
    }
  }
  return out;
}

/** Renders a code block with line numbers, as an editor would. */
export function codeBlock(source: string, label = 'python'): string {
  const lines = source.replace(/\s+$/, '').split('\n');
  const gutter = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
  return `
    <div class="code-block">
      <div class="code-head">
        <span class="code-dots"><i></i><i></i><i></i></span>
        <span class="code-lang mono">${esc(label)}</span>
      </div>
      <div class="code-body">
        <div class="code-gutter mono" aria-hidden="true">${gutter}</div>
        <pre class="code-pre mono"><code>${highlightPython(source)}</code></pre>
      </div>
    </div>`;
}
