const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('  Prime Telecare — Full-Stack Development Launcher  ');
console.log('====================================================\n');

// 1. Start Express Telehealth Core API Server (Port 5000)
console.log('[Dev] Starting Telehealth Core API on http://localhost:5000...');
const serverProcess = spawn('node', ['./node_modules/tsx/dist/cli.mjs', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000', NODE_ENV: 'development' },
});

// 2. Start Vite Dev Server (Port 3000, proxies /api -> http://localhost:5000)
console.log('[Dev] Starting Vite Frontend on http://localhost:3000...');
const viteProcess = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

function cleanup() {
  console.log('\n[Dev] Shutting down Prime Telecare processes...');
  serverProcess.kill();
  viteProcess.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

