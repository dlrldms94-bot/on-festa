import bcrypt from 'bcryptjs';

export function requireAdmin(req, res, next) {
  if (req.session?.admin === true) {
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized' });
}

export async function verifyAdminPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const plain = process.env.ADMIN_PASSWORD;

  if (hash) {
    return bcrypt.compare(password, hash);
  }
  if (plain) {
    return password === plain;
  }
  return false;
}

export function buildSessionConfig() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  const isProd = process.env.NODE_ENV === 'production';
  return {
    name: 'onfesta.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12,
    },
  };
}
