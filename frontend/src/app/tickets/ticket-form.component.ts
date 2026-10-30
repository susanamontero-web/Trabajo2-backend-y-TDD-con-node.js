import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CATEGORIAS, ESTADOS, PRIORIDADES, TicketData } from './ticket';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-ticket-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './ticket-form.component.html'
})
export class TicketFormComponent implements OnInit {
  private servicio = inject(TicketService);
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);
  id: number | null = null;
  categorias = CATEGORIAS;
  prioridades = PRIORIDADES;
  estados = ESTADOS;
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  cargaFallida = signal(false);
  ticket: TicketData = {
    asunto: '', solicitante: '', descripcion: '',
    categoria: '', prioridad: 'Media', estado: 'Abierto'
  };

  ngOnInit() {
    const parametro = this.ruta.snapshot.paramMap.get('id');
    if (parametro !== null) {
      this.id = Number(parametro);
      if (!Number.isSafeInteger(this.id) || this.id <= 0) {
        this.error.set('El identificador del ticket no es válido.');
        this.cargaFallida.set(true);
        return;
      }
      this.cargando.set(true);
      this.servicio.obtener(this.id).subscribe({
        next: (ticket) => {
          this.ticket = {
            asunto: ticket.asunto, solicitante: ticket.solicitante,
            descripcion: ticket.descripcion, categoria: ticket.categoria,
            prioridad: ticket.prioridad, estado: ticket.estado
          };
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el ticket. Vuelve al listado e intenta nuevamente.');
          this.cargaFallida.set(true);
          this.cargando.set(false);
        }
      });
    }
  }

  guardar(formulario: NgForm) {
    if (this.guardando() || this.cargando() || this.cargaFallida()) return;
    this.error.set('');
    if (formulario.invalid) {
      formulario.control.markAllAsTouched();
      this.error.set('Revisa los campos obligatorios del formulario.');
      return;
    }
    const datos: TicketData = {
      ...this.ticket,
      asunto: this.ticket.asunto.trim(),
      solicitante: this.ticket.solicitante.trim(),
      descripcion: this.ticket.descripcion.trim()
    };
    if (!datos.asunto || !datos.solicitante || !datos.descripcion) {
      this.error.set('Asunto, solicitante y descripción no pueden contener solamente espacios.');
      return;
    }
    this.guardando.set(true);
    const solicitud = this.id === null
      ? this.servicio.crear(datos)
      : this.servicio.actualizar(this.id, datos);
    solicitud.subscribe({
      next: () => {
        this.guardando.set(false);
        void this.router.navigate(['/tickets']);
      },
      error: () => {
        this.error.set('No se pudo guardar el ticket. Tus datos siguen en el formulario; intenta nuevamente.');
        this.guardando.set(false);
      }
    });
  }
}
