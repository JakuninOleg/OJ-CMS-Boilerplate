import { getPayload } from 'payload';
import config from '../src/payload.config';
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 16) throw new Error('Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 16 characters');
const payload = await getPayload({ config });
try {
  if ((await payload.count({ collection: 'users', where: { email: { equals: email } } })).totalDocs) throw new Error('Account already exists; password was not changed');
  await payload.create({ collection: 'users', data: { email, password, name: process.env.ADMIN_NAME || 'Администратор', role: 'administrator' } });
  console.log('Administrator created. Remove ADMIN_PASSWORD from your environment.');
} finally { await payload.destroy(); }
process.exit(0);
