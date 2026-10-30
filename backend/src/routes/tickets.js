import { Router } from 'express';

const categorias = ['Hardware', 'Software', 'Redes', 'Accesos', 'Otro'];
const prioridades = ['Baja', 'Media', 'Alta'];
const estados = ['Abierto', 'En proceso', 'Cerrado'];

function validarTicket(req, res, next) {
  const datos = req.body;
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return res.status(400).json({ mensaje: 'Debes enviar los datos del ticket.' });
  }

  const limites = { asunto: 150, solicitante: 100, descripcion: 2000 };
  const ticket = {};
  for (const [campo, limite] of Object.entries(limites)) {
    if (typeof datos[campo] !== 'string' || !datos[campo].trim() || datos[campo].trim().length > limite) {
      return res.status(400).json({ mensaje: `El campo ${campo} es obligatorio y admite hasta ${limite} caracteres.` });
    }
    ticket[campo] = datos[campo].trim();
  }

  if (!categorias.includes(datos.categoria)) {
    return res.status(400).json({ mensaje: 'La categoría no es válida.' });
  }
  if (!prioridades.includes(datos.prioridad)) {
    return res.status(400).json({ mensaje: 'La prioridad no es válida.' });
  }
  if (!estados.includes(datos.estado)) {
    return res.status(400).json({ mensaje: 'El estado no es válido.' });
  }

  req.ticket = { ...ticket, categoria: datos.categoria, prioridad: datos.prioridad, estado: datos.estado };
  next();
}

export function crearRutasTickets(repository) {
  const router = Router();

  router.param('id', (req, res, next, valor) => {
    const id = Number(valor);
    if (!/^\d+$/.test(valor) || !Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: 'El identificador del ticket no es válido.' });
    }
    req.ticketId = id;
    next();
  });

  router.get('/', async (req, res) => {
    res.json(await repository.listar());
  });

  router.get('/:id', async (req, res) => {
    const ticket = await repository.obtener(req.ticketId);
    if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado.' });
    return res.json(ticket);
  });

  router.post('/', validarTicket, async (req, res) => {
    const ticket = await repository.crear(req.ticket);
    res.location(`/api/tickets/${ticket.id}`).status(201).json(ticket);
  });

  router.put('/:id', validarTicket, async (req, res) => {
    const ticket = await repository.actualizar(req.ticketId, req.ticket);
    if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado.' });
    return res.json(ticket);
  });

  router.delete('/:id', async (req, res) => {
    const eliminado = await repository.eliminar(req.ticketId);
    if (!eliminado) return res.status(404).json({ mensaje: 'Ticket no encontrado.' });
    return res.status(204).end();
  });

  return router;
}
