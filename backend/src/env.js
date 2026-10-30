import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Carga siempre el .env del backend, aunque se ejecute desde otra carpeta.
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
