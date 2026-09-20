import { createApp } from './app.js';

const app = await createApp();
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => {
    console.log('API server stopped');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 5000);
}

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, shutdown);
}