import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

const apiKey = generateApiKey();
const hashedApiKey = hashApiKey(apiKey);

console.log(`Generated API Key: ${apiKey}`);
console.log(`Hashed API Key (store this in your environment): ${hashedApiKey}`);
