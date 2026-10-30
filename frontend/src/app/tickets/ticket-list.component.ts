import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Ticket } from './ticket';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-ticket-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './ticket-list.component.html'
})
export class TicketListComponent implements OnInit {
  private servicio = inject(TicketService);
  tickets = signal<Ticket[]>([]);
  cargando = signal(false);
  eliminando = signal<number | null>(null);
  error = signal('');
  mensaje = signal('');

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los tickets. Intenta nuevamente.');
        this.cargando.set(false);
      }
    });
  }

  eliminar(ticket: Ticket) {
    if (this.eliminando() !== null || !window.confirm('¿Eliminar el ticket "' + ticket.asunto + '"?')) return;
    this.eliminando.set(ticket.id);
    this.error.set('');
    this.mensaje.set('');
    this.servicio.eliminar(ticket.id).subscribe({
      next: () => {
        this.tickets.update((tickets) => tickets.filter((item) => item.id !== ticket.id));
        this.mensaje.set('Ticket eliminado correctamente.');
        this.eliminando.set(null);
      },
      error: () => {
        this.error.set('No se pudo eliminar el ticket. Intenta nuevamente.');
        this.eliminando.set(null);
      }
    });
  }
}
