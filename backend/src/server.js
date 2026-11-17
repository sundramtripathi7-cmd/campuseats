const app = require('./app');
const config = require('./config/env');
const { initDatabase } = require('./config/db');

async function startServer() {
  console.log(`[CampusEats] Starting server in ${config.nodeEnv} mode...`);

  // Initialize database tables if connected
  await initDatabase();

  const server = app.listen(config.port, () => {
    console.log(`[CampusEats] Server running on http://127.0.0.1:${config.port}`);
    console.log(`[CampusEats] Frontend: http://127.0.0.1:${config.port}/`);
    console.log(`[CampusEats] GraphQL:  http://127.0.0.1:${config.port}/graphql`);
    console.log(`[CampusEats] Catalog:  http://127.0.0.1:${config.port}/menu-items`);
    console.log(`[CampusEats] Orders:   http://127.0.0.1:${config.port}/orders`);
    console.log(`[CampusEats] Payments: http://127.0.0.1:${config.port}/payments`);
    console.log(`[CampusEats] Auth:     http://127.0.0.1:${config.port}/api/auth`);
  });

  const shutdown = () => {
    console.log('[CampusEats] Shutting down gracefully...');
    server.close(() => {
      console.log('[CampusEats] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(err => {
  console.error('[CampusEats] Failed to start server:', err);
  process.exit(1);
});

