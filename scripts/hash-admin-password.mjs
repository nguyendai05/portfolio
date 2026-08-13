import crypto from 'node:crypto';
import { promisify } from 'node:util';

const password = process.argv[2];
if (!password) throw new Error('Usage: node scripts/hash-admin-password.mjs <password>');
const salt = crypto.randomBytes(16).toString('base64url');
const derived = await promisify(crypto.scrypt)(password, salt, 32);
console.log(`scrypt$${salt}$${Buffer.from(derived).toString('base64url')}`);
