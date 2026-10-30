import { pool } from '../database.js';

// Los parámetros (?) mantienen los datos del usuario separados del SQL.
export function crearTicketsRepository(db) {
  return {
    async listar() {
      const [tickets] = await db.execute('SELECT * FROM tickets ORDER BY id DESC');
      return tickets;
    },

    async obtener(id) {
      const [tickets] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
      return tickets[0] || null;
    },

    async crear(ticket) {
      const { asunto, solicitante, descripcion, categoria, prioridad, estado } = ticket;
      const [resultado] = await db.execute(
        'INSERT INTO tickets (asunto, solicitante, descripcion, categoria, prioridad, estado) VALUES (?, ?, ?, ?, ?, ?)',
        [asunto, solicitante, descripcion, categoria, prioridad, estado]
      );
      return this.obtener(resultado.insertId);
    },

    async actualizar(id, ticket) {
      const { asunto, solicitante, descripcion, categoria, prioridad, estado } = ticket;
      const [resultado] = await db.execute(
        'UPDATE tickets SET asunto = ?, solicitante = ?, descripcion = ?, categoria = ?, prioridad = ?, estado = ? WHERE id = ?',
        [asunto, solicitante, descripcion, categoria, prioridad, estado, id]
      );
      if (resultado.affectedRows === 0) return null;
      return this.obtener(id);
    },

    async eliminar(id) {
      const [resultado] = await db.execute('DELETE FROM tickets WHERE id = ?', [id]);
      return resultado.affectedRows > 0;
    }
  };
}

export const ticketsRepository = crearTicketsRepository(pool);
