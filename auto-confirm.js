import { spawn } from 'child_process';

console.log('Starting database push with auto-confirmation...');

const child = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, DATABASE_URL: 'postgresql://postgres:Starbucks%239@localhost:5432/opuslearn' }
});

// Wait a bit for the prompt to appear, then send "Yes"
setTimeout(() => {
  console.log('Sending "Yes" to confirm...');
  child.stdin.write('Yes\n');
  child.stdin.end();
}, 2000);

child.on('close', (code) => {
  console.log(`Database push completed with code: ${code}`);
}); 