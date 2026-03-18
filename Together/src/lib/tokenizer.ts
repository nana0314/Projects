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
      // Accumulate CJK runs and Latin runs separately
      let cjkRun = '';
      let latinRun = '';
      for (const char of seg) {
        if (isCJK(char)) {
          // Flush any pending latin run first
          if (latinRun.trim().length > 1) tokens.add(latinRun.toLowerCase().trim());
          latinRun = '';
          cjkRun += char;
        } else {
          // Flush any pending CJK run first, generating bigrams
          if (cjkRun) { bigrams(cjkRun).forEach(b => tokens.add(b)); cjkRun = ''; }
          latinRun += char;
        }
      }
      if (cjkRun) bigrams(cjkRun).forEach(b => tokens.add(b));
      if (latinRun.trim().length > 1) tokens.add(latinRun.toLowerCase().trim());
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
