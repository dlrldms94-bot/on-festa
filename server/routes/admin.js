import { Router } from 'express';
import { requireAdmin, verifyAdminPassword } from '../auth.js';

const router = Router();

router.get('/session', (req, res) => {
  res.json({ authenticated: req.session?.admin === true });
});

router.post('/login', async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    res.status(400).json({ error: 'password required' });
    return;
  }

  const ok = await verifyAdminPassword(password);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  req.session.admin = true;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('onfesta.sid');
    res.json({ ok: true });
  });
});

export default router;
