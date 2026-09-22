import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { initDb } from './db.js';
import { seedNoticesIfEmpty } from './seed.js';
import { buildSessionConfig } from './auth.js';
import noticesRouter from './routes/notices.js';
import adminRouter from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.join(__dirname, '..');
const port = parseInt(process.env.PORT, 10) || 3000;

const app = express();

app.set('trust proxy', 1);
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());
app.use(session(buildSessionConfig()));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/notices', noticesRouter);
app.use('/api/admin', adminRouter);

app.use(express.static(siteRoot, { index: 'index.html' }));

async function start() {
  await initDb();
  if (process.env.DATABASE_URL) {
    await seedNoticesIfEmpty();
  }
  app.listen(port, () => {
    console.log(`ON Festa server listening on ${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
