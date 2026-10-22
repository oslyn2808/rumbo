import { createApp } from './app.js';
import { config } from './config.js';
import { buildServices } from './container.js';
import { openDatabase } from './data/database.js';

const db = openDatabase(config.databasePath);
const app = createApp({ services: buildServices({ db, config }), config });

const server = app.listen(config.port, () => {
  console.log(`Rumbo API lista en http://localhost:${config.port}`);
  console.log(config.demoMode ? 'Modo demo: sin ANTHROPIC_API_KEY la IA responde con ejemplos.' : 'IA activada.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
