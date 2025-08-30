import { spawn } from 'node:child_process';

const child = spawn('vite', ['build'], {
  stdio: 'inherit',
  shell: true, // make it work cross‑platform
  env: { ...process.env, ANALYZE: 'true' },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

