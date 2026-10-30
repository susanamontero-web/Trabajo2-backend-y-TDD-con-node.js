import './env.js';
import app from './app.js';
import { pool } from './database.js';

const port = process.env.PORT || 3000;

try {
  await pool.execute('SELECT id FROM tickets LIMIT 1');
  app.listen(port, () => {
    console.log(`API de soporte técnico disponible en http://localhost:${port}`);
  });
} catch (error) {
  console.error('No se pudo conectar a MySQL. Revisa backend/.env y ejecuta npm run db:init en backend.');
  console.error('Código:', error.code);
  await pool.end();
  process.exitCode = 1;
}
