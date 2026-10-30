import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket, TicketData } from './ticket';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private url = 'http://localhost:3000/api/tickets';

  listar() { return this.http.get<Ticket[]>(this.url); }
  obtener(id: number) { return this.http.get<Ticket>(this.url + '/' + id); }
  crear(ticket: TicketData) { return this.http.post<Ticket>(this.url, ticket); }
  actualizar(id: number, ticket: TicketData) {
    return this.http.put<Ticket>(this.url + '/' + id, ticket);
  }
  eliminar(id: number) { return this.http.delete<void>(this.url + '/' + id); }
}
