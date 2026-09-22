import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js YOUR_PASSWORD');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('Add to Render environment variables:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('(Remove ADMIN_PASSWORD if set.)');
