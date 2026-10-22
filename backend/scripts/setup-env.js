// Crea backend/.env a partir de .env.example y genera un JWT_SECRET aleatorio.
// Uso: npm run setup
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, '.env');

if (fs.existsSync(target)) {
  console.log('Ya existe backend/.env. No se modificó nada.');
  process.exit(0);
}

const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const secret = crypto.randomBytes(48).toString('hex');
fs.writeFileSync(target, example.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`));
console.log('Listo: se creó backend/.env con un JWT_SECRET nuevo.');
console.log('Para usar la IA real, escribe tu clave en ANTHROPIC_API_KEY dentro de ese archivo.');
