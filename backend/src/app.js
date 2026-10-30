import express from 'express';
import cors from 'cors';
import { crearRutasTickets } from './routes/tickets.js';
import { ticketsRepository } from './repositories/tickets.js';

export function crearApp(repository = ticketsRepository) {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200' }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/tickets', crearRutasTickets(repository));

  app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada.' });
  });

  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ mensaje: 'El cuerpo debe ser un JSON válido.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ mensaje: 'La solicitud supera el tamaño permitido.' });
    }
    console.error('Error en la API:', error.message);
    return res.status(500).json({ mensaje: 'No se pudo completar la operación. Intenta nuevamente.' });
  });

  return app;
}

export default crearApp();
