export const NOTICE_LANGS = ['ko', 'en', 'zh', 'ja'];

export function normalizeNoticeLang(raw) {
  return NOTICE_LANGS.includes(raw) ? raw : 'ko';
}

export function parseTranslations(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function pickNoticeContent(translations, lang) {
  const map = parseTranslations(translations);
  const order = [normalizeNoticeLang(lang), 'ko', 'en', 'zh', 'ja'];
  const seen = new Set();
  for (const code of order) {
    if (seen.has(code)) continue;
    seen.add(code);
    const block = map[code];
    if (!block) continue;
    const title = String(block.title || '').trim();
    const body = String(block.body || '').trim();
    if (title) return { title, body, langUsed: code };
  }
  return { title: '', body: '', langUsed: 'ko' };
}

export function normalizeNoticeTranslations(input) {
  const raw = input && typeof input === 'object' ? input : {};
  const out = {};
  for (const code of NOTICE_LANGS) {
    const block = raw[code];
    if (!block || typeof block !== 'object') continue;
    const title = String(block.title || '').trim();
    const body = String(block.body || '').trim();
    if (!title && !body) continue;
    if (!title || !body) {
      const err = new Error(`Each language must include both title and body (${code})`);
      err.status = 400;
      throw err;
    }
    out[code] = { title, body };
  }
  const compact = compactTranslations(out);
  if (!compact.ko) {
    const err = new Error('Korean (ko) title and body are required');
    err.status = 400;
    throw err;
  }
  return compact;
}

export function emptyTranslationsTemplate() {
  return {
    ko: { title: '', body: '' },
    en: { title: '', body: '' },
    zh: { title: '', body: '' },
    ja: { title: '', body: '' },
  };
}

export function compactTranslations(map) {
  const out = {};
  for (const code of NOTICE_LANGS) {
    const block = map?.[code];
    if (!block) continue;
    const title = String(block.title || '').trim();
    const body = String(block.body || '').trim();
    if (title && body) out[code] = { title, body };
  }
  return out;
}

export function mergeTranslations(existing, incoming) {
  const base = { ...emptyTranslationsTemplate(), ...parseTranslations(existing) };
  const raw = incoming && typeof incoming === 'object' ? incoming : {};

  for (const code of NOTICE_LANGS) {
    if (!(code in raw)) continue;
    const block = raw[code];
    const title = String(block?.title || '').trim();
    const body = String(block?.body || '').trim();
    if (!title && !body) {
      base[code] = { title: '', body: '' };
      continue;
    }
    if (!title || !body) {
      const err = new Error(`Each language must include both title and body (${code})`);
      err.status = 400;
      throw err;
    }
    base[code] = { title, body };
  }

  const compact = compactTranslations(base);
  if (!compact.ko) {
    const err = new Error('Korean (ko) title and body are required');
    err.status = 400;
    throw err;
  }
  return compact;
}
