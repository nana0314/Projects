const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/;

function isCJK(char: string): boolean {
  return CJK_RE.test(char);
}

function bigrams(text: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < text.length - 1; i++) {
    result.push(text.slice(i, i + 2));
  }
  if (text.length === 1) result.push(text);
  return result;
}

export function tokenize(text: string): string[] {
  const tokens = new Set<string>();
  // split on whitespace and common punctuation
  const segments = text.split(/[\s\p{P}]+/u).filter(Boolean);

  for (const seg of segments) {
    if (CJK_RE.test(seg)) {
      // mixed segment — split into CJK runs and latin runs
      let buf = '';
      for (const char of seg) {
        if (isCJK(char)) {
          if (buf) {
            buf.toLowerCase().split('').filter(Boolean).forEach(w => tokens.add(w));
            buf = '';
          }
          buf += char;
        } else {
          if (buf && CJK_RE.test(buf)) {
            bigrams(buf).forEach(b => tokens.add(b));
            buf = '';
          }
          buf += char;
        }
      }
      if (buf) {
        if (CJK_RE.test(buf)) bigrams(buf).forEach(b => tokens.add(b));
        else if (buf.trim()) tokens.add(buf.toLowerCase());
      }
    } else {
      const w = seg.toLowerCase();
      if (w.length > 1) tokens.add(w);
    }
  }

  return Array.from(tokens);
}

export function buildSearchTokens(parts: string[]): string[] {
  const tokens = new Set<string>();
  for (const part of parts) {
    tokenize(part).forEach(t => tokens.add(t));
  }
  return Array.from(tokens).slice(0, 200);
}
