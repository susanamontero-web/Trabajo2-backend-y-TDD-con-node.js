import { Routes } from '@angular/router';
import { TicketListComponent } from './tickets/ticket-list.component';
import { TicketFormComponent } from './tickets/ticket-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tickets', pathMatch: 'full' },
  { path: 'tickets', component: TicketListComponent, title: 'Tickets | Mesa de ayuda' },
  { path: 'tickets/nuevo', component: TicketFormComponent, title: 'Nuevo ticket | Mesa de ayuda' },
  { path: 'tickets/:id/editar', component: TicketFormComponent, title: 'Editar ticket | Mesa de ayuda' },
  { path: '**', redirectTo: 'tickets' }
];
