import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { TicketListComponent } from './ticket-list.component';
import { TicketFormComponent } from './ticket-form.component';
import { Ticket } from './ticket';

const url = 'http://localhost:3000/api/tickets';
const ticket: Ticket = {
  id: 1, asunto: 'Falla de correo', solicitante: 'Susana',
  descripcion: 'No puedo ingresar al correo', categoria: 'Accesos',
  prioridad: 'Alta', estado: 'Abierto', fechaRegistro: '2026-10-29T12:00:00Z'
};

describe('Listado de tickets', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TicketListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); vi.restoreAllMocks(); });

  it('muestra los tickets obtenidos desde la API', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    fixture.detectChanges();
    http.expectOne(url).flush([ticket]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Falla de correo');
    expect(fixture.nativeElement.querySelector('.high').textContent).toContain('Alta');
  });

  it('informa un error de comunicación', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    fixture.detectChanges();
    http.expectOne(url).flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('No se pudieron cargar');
  });

  it('solo elimina después de confirmar y actualiza el listado', () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    fixture.detectChanges();
    http.expectOne(url).flush([ticket]);
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.eliminar(ticket);
    http.expectNone(url + '/1');
    confirmar.mockReturnValue(true);
    fixture.componentInstance.eliminar(ticket);
    const peticion = http.expectOne(url + '/1');
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);
    expect(fixture.componentInstance.tickets()).toEqual([]);
  });
});

describe('Formulario de tickets', () => {
  let http: HttpTestingController;

  function preparar(id: string | null = null) {
    TestBed.configureTestingModule({
      imports: [TicketFormComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.createComponent(TicketFormComponent);
  }

  afterEach(() => { http.verify(); vi.restoreAllMocks(); });

  it('rechaza los campos vacíos sin enviar datos', async () => {
    const fixture = preparar();
    fixture.detectChanges();
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    http.expectNone(url);
    expect(fixture.componentInstance.error()).toContain('campos obligatorios');
    expect(fixture.nativeElement.querySelector('#error-asunto')).not.toBeNull();
  });

  it('crea un ticket con los datos del formulario', async () => {
    const fixture = preparar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.ticket = { ...ticket, asunto: ' Falla de correo ' };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const peticion = http.expectOne(url);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body.asunto).toBe('Falla de correo');
    peticion.flush(ticket);
    expect(navegar).toHaveBeenCalledWith(['/tickets']);
  });

  it('carga un ticket para editar y conserva los datos si falla el guardado', async () => {
    const fixture = preparar('1');
    fixture.detectChanges();
    http.expectOne(url + '/1').flush(ticket);
    await fixture.whenStable();
    fixture.componentInstance.ticket.asunto = 'Correo actualizado';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const peticion = http.expectOne(url + '/1');
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body.asunto).toBe('Correo actualizado');
    peticion.flush({}, { status: 500, statusText: 'Error' });
    expect(fixture.componentInstance.error()).toContain('No se pudo guardar');
    expect(fixture.componentInstance.ticket.asunto).toBe('Correo actualizado');
    expect(fixture.componentInstance.guardando()).toBe(false);
  });

  it('bloquea la edición si el ticket no existe', async () => {
    const fixture = preparar('99');
    fixture.detectChanges();
    http.expectOne(url + '/99').flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.componentInstance.error()).toContain('No se pudo cargar');
  });
});
