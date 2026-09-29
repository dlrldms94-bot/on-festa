import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAdmin } from '../auth.js';
import {
  NOTICE_LANGS,
  normalizeNoticeLang,
  pickNoticeContent,
  normalizeNoticeTranslations,
  mergeTranslations,
  parseTranslations,
} from '../notice-i18n.js';

const router = Router();

function isAdmin(req) {
  return req.session?.admin === true;
}

function emptyTranslationsFromRow(row) {
  const koTitle = row.title || '';
  const koBody = row.body || '';
  return {
    ko: { title: koTitle, body: koBody },
    en: { title: '', body: '' },
    zh: { title: '', body: '' },
    ja: { title: '', body: '' },
  };
}

function formatAdminNotice(row) {
  return {
    id: row.id,
    is_pinned: row.is_pinned,
    created_at: row.created_at,
    updated_at: row.updated_at,
    translations: {
      ...emptyTranslationsFromRow(row),
      ...parseTranslations(row.translations),
    },
  };
}

function mapPublicListItem(row, lang) {
  let { title } = pickNoticeContent(row.translations, lang);
  if (!title && row.title) title = row.title;
  return {
    id: row.id,
    title,
    is_pinned: row.is_pinned,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const lang = normalizeNoticeLang(req.query.lang);

  try {
    const pool = getPool();
    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM notices');
    const total = countResult.rows[0].total;

    const { rows } = await pool.query(
      `SELECT id, title, body, translations, is_pinned, created_at, updated_at
       FROM notices
       ORDER BY is_pinned DESC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = rows.map((row) => {
      if (isAdmin(req)) {
        const ko = pickNoticeContent(row.translations, 'ko');
        const parsed = parseTranslations(row.translations);
        return {
          id: row.id,
          title: ko.title || row.title,
          is_pinned: row.is_pinned,
          created_at: row.created_at,
          updated_at: row.updated_at,
          langs: NOTICE_LANGS.filter((code) => Boolean(parsed[code]?.title?.trim())),
        };
      }
      return mapPublicListItem(row, lang);
    });

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load notices' });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const lang = normalizeNoticeLang(req.query.lang);

  try {
    const { rows } = await getPool().query(
      `SELECT id, title, body, translations, is_pinned, created_at, updated_at FROM notices WHERE id = $1`,
      [id]
    );
    if (!rows.length) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const row = rows[0];

    if (isAdmin(req)) {
      res.json(formatAdminNotice(row));
      return;
    }

    let { title, body } = pickNoticeContent(row.translations, lang);
    if (!title && row.title) {
      title = row.title;
      body = row.body || '';
    }
    if (!title) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({
      id: row.id,
      title,
      body,
      is_pinned: row.is_pinned,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load notice' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  let translations;
  try {
    translations = normalizeNoticeTranslations(req.body?.translations);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
    return;
  }

  const isPinned = Boolean(req.body?.is_pinned);
  const ko = translations.ko;

  try {
    const { rows } = await getPool().query(
      `INSERT INTO notices (title, body, is_pinned, translations)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id, title, body, translations, is_pinned, created_at, updated_at`,
      [ko.title, ko.body, isPinned, JSON.stringify(translations)]
    );
    res.status(201).json(formatAdminNotice(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  let translations;
  try {
    const existing = await getPool().query(`SELECT translations FROM notices WHERE id = $1`, [id]);
    if (!existing.rows.length) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    translations = mergeTranslations(existing.rows[0].translations, req.body?.translations);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
    return;
  }

  const isPinned = Boolean(req.body?.is_pinned);
  const ko = translations.ko;

  try {
    const { rows } = await getPool().query(
      `UPDATE notices
       SET title = $1, body = $2, is_pinned = $3, translations = $4::jsonb, updated_at = NOW()
       WHERE id = $5
       RETURNING id, title, body, translations, is_pinned, created_at, updated_at`,
      [ko.title, ko.body, isPinned, JSON.stringify(translations), id]
    );
    if (!rows.length) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(formatAdminNotice(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notice' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  try {
    const result = await getPool().query('DELETE FROM notices WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

export default router;
