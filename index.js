
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hostinger-də TypeScript serverini işə salmaq üçün köməkçi JavaScript faylı
console.log('Tətbiq başladılır...');

const child = spawn('node', ['--import', 'tsx', path.join(__dirname, 'server.ts')], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

child.on('close', (code) => {
  console.log(`Tətbiq ${code} kodu ilə dayandı.`);
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Tətbiq başladılarkən xəta baş verdi:', err);
});
