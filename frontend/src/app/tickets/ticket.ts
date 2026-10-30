export const CATEGORIAS = ['Hardware', 'Software', 'Redes', 'Accesos', 'Otro'];
export const PRIORIDADES = ['Baja', 'Media', 'Alta'];
export const ESTADOS = ['Abierto', 'En proceso', 'Cerrado'];

export interface TicketData {
  asunto: string;
  solicitante: string;
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
}

export interface Ticket extends TicketData {
  id: number;
  fechaRegistro: string;
}
