import { spawn } from 'child_process';

const child = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, DATABASE_URL: 'postgresql://postgres:Starbucks%239@localhost:5432/opuslearn' }
});

// Send "Yes" to stdin after a short delay
setTimeout(() => {
  child.stdin.write('Yes\n');
  child.stdin.end();
}, 1000); 