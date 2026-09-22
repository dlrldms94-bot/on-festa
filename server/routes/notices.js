import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAdmin } from '../auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  try {
    const pool = getPool();
    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM notices');
    const total = countResult.rows[0].total;

    const { rows } = await pool.query(
      `SELECT id, title, is_pinned, created_at, updated_at
       FROM notices
       ORDER BY is_pinned DESC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ items: rows, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
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

  try {
    const { rows } = await getPool().query(
      `SELECT id, title, body, is_pinned, created_at, updated_at FROM notices WHERE id = $1`,
      [id]
    );
    if (!rows.length) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load notice' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { title, body, is_pinned: isPinned } = req.body || {};
  if (!title?.trim() || !body?.trim()) {
    res.status(400).json({ error: 'title and body are required' });
    return;
  }

  try {
    const { rows } = await getPool().query(
      `INSERT INTO notices (title, body, is_pinned)
       VALUES ($1, $2, $3)
       RETURNING id, title, body, is_pinned, created_at, updated_at`,
      [title.trim(), body.trim(), Boolean(isPinned)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, body, is_pinned: isPinned } = req.body || {};
  if (!Number.isFinite(id) || !title?.trim() || !body?.trim()) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  try {
    const { rows } = await getPool().query(
      `UPDATE notices
       SET title = $1, body = $2, is_pinned = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, title, body, is_pinned, created_at, updated_at`,
      [title.trim(), body.trim(), Boolean(isPinned), id]
    );
    if (!rows.length) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(rows[0]);
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
