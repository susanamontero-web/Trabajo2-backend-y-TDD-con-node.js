import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../src/app.js';
import { crearTicketsRepository } from '../src/repositories/tickets.js';

const datos = {
  asunto: 'Problema de correo', solicitante: 'Susana',
  descripcion: 'No puedo ingresar al correo', categoria: 'Accesos',
  prioridad: 'Alta', estado: 'Abierto'
};
const ticket = { id: 1, ...datos, fechaRegistro: '2026-10-29T12:00:00Z' };

// Sustitutos exclusivos de pruebas: los endpoints reales utilizan MySQL.
function preparar(cambios = {}) {
  const repository = {
    listar: mock.fn(async () => [ticket]),
    obtener: mock.fn(async () => ticket),
    crear: mock.fn(async (datos) => ({ ...ticket, ...datos })),
    actualizar: mock.fn(async (id, datos) => ({ ...ticket, ...datos, id })),
    eliminar: mock.fn(async () => true),
    ...cambios
  };
  return { api: request(crearApp(repository)), repository };
}

test('GET /api/tickets devuelve el listado', async () => {
  const { api } = preparar();
  const respuesta = await api.get('/api/tickets').expect(200);
  assert.deepEqual(respuesta.body, [ticket]);
});

test('GET /api/tickets permite un listado vacío', async () => {
  const { api } = preparar({ listar: async () => [] });
  const respuesta = await api.get('/api/tickets').expect(200);
  assert.deepEqual(respuesta.body, []);
});

test('GET /api/tickets/:id obtiene un ticket', async () => {
  const { api, repository } = preparar();
  const respuesta = await api.get('/api/tickets/1').expect(200);
  assert.deepEqual(respuesta.body, ticket);
  assert.equal(repository.obtener.mock.calls[0].arguments[0], 1);
});

test('POST crea un ticket, recorta espacios e ignora campos ajenos', async () => {
  const { api, repository } = preparar();
  const respuesta = await api.post('/api/tickets').send({ ...datos, asunto: ' Problema de correo ', id: 99 }).expect(201);
  assert.equal(respuesta.headers.location, '/api/tickets/1');
  assert.equal(respuesta.body.id, 1);
  assert.deepEqual(repository.crear.mock.calls[0].arguments[0], datos);
});

test('PUT modifica el ticket', async () => {
  const { api, repository } = preparar();
  const cambios = { ...datos, estado: 'Cerrado' };
  const respuesta = await api.put('/api/tickets/1').send(cambios).expect(200);
  assert.equal(respuesta.body.estado, 'Cerrado');
  assert.deepEqual(repository.actualizar.mock.calls[0].arguments, [1, cambios]);
});

test('DELETE elimina un ticket y responde sin cuerpo', async () => {
  const { api, repository } = preparar();
  const respuesta = await api.delete('/api/tickets/1').expect(204);
  assert.equal(respuesta.text, '');
  assert.equal(repository.eliminar.mock.calls[0].arguments[0], 1);
});

test('GET, PUT y DELETE responden 404 si el ticket no existe', async () => {
  const { api } = preparar({ obtener: async () => null, actualizar: async () => null, eliminar: async () => false });
  await api.get('/api/tickets/99').expect(404);
  await api.put('/api/tickets/99').send(datos).expect(404);
  await api.delete('/api/tickets/99').expect(404);
});

test('rechaza identificadores inválidos antes de consultar MySQL', async () => {
  const { api, repository } = preparar();
  for (const id of ['0', '-1', 'abc', '1.2', '1e2', '9007199254740992']) {
    await api.get('/api/tickets/' + id).expect(400);
    await api.put('/api/tickets/' + id).send(datos).expect(400);
    await api.delete('/api/tickets/' + id).expect(400);
  }
  assert.equal(repository.obtener.mock.callCount(), 0);
  assert.equal(repository.actualizar.mock.callCount(), 0);
  assert.equal(repository.eliminar.mock.callCount(), 0);
});

test('POST y PUT validan campos, tipos, longitudes y opciones', async () => {
  const { api, repository } = preparar();
  const invalidos = [
    {}, [], { ...datos, asunto: '   ' }, { ...datos, asunto: 123 },
    { ...datos, asunto: 'a'.repeat(151) }, { ...datos, solicitante: '' },
    { ...datos, solicitante: 'a'.repeat(101) }, { ...datos, descripcion: null },
    { ...datos, descripcion: 'a'.repeat(2001) },
    { ...datos, categoria: 'Inexistente' }, { ...datos, prioridad: 'Urgente' },
    { ...datos, estado: 'Resuelto' }
  ];
  for (const invalido of invalidos) {
    await api.post('/api/tickets').send(invalido).expect(400);
    await api.put('/api/tickets/1').send(invalido).expect(400);
  }
  await api.post('/api/tickets').expect(400);
  assert.equal(repository.crear.mock.callCount(), 0);
  assert.equal(repository.actualizar.mock.callCount(), 0);
});

test('informa JSON inválido y solicitudes demasiado grandes', async () => {
  const { api } = preparar();
  await api.post('/api/tickets').set('Content-Type', 'application/json').send('{').expect(400);
  await api.post('/api/tickets').send({ ...datos, descripcion: 'a'.repeat(110000) }).expect(413);
});

test('los errores de base de datos responden 500 sin exponer detalles internos', async () => {
  const fallar = async () => { throw new Error('Detalle privado de conexión'); };
  const { api } = preparar({ listar: fallar, obtener: fallar, crear: fallar, actualizar: fallar, eliminar: fallar });
  const respuestas = [
    await api.get('/api/tickets'), await api.get('/api/tickets/1'),
    await api.post('/api/tickets').send(datos),
    await api.put('/api/tickets/1').send(datos), await api.delete('/api/tickets/1')
  ];
  for (const respuesta of respuestas) {
    assert.equal(respuesta.status, 500);
    assert.equal(respuesta.body.mensaje.includes('Detalle privado'), false);
  }
});

test('configura CORS para Angular y responde 404 a rutas inexistentes', async () => {
  const { api } = preparar();
  const respuesta = await api.get('/api/tickets').set('Origin', 'http://localhost:4200').expect(200);
  assert.equal(respuesta.headers['access-control-allow-origin'], 'http://localhost:4200');
  await api.get('/ruta-inexistente').expect(404);
});

test('el repositorio usa parámetros para buscar, insertar, actualizar y eliminar', async () => {
  const llamadas = [];
  const peligroso = "'; DROP TABLE tickets; --";
  const db = {
    async execute(sql, valores) {
      llamadas.push({ sql, valores });
      if (sql.startsWith('SELECT')) return [[ticket]];
      return [{ insertId: 1, affectedRows: 1 }];
    }
  };
  const repository = crearTicketsRepository(db);
  await repository.listar();
  await repository.obtener(1);
  await repository.crear({ ...datos, asunto: peligroso });
  await repository.actualizar(1, { ...datos, asunto: peligroso });
  assert.equal(await repository.eliminar(1), true);
  for (const llamada of llamadas) {
    assert.equal(llamada.sql.includes(peligroso), false);
  }
  const insercion = llamadas.find((llamada) => llamada.sql.startsWith('INSERT'));
  assert.equal(insercion.valores[0], peligroso);
  assert.equal(insercion.valores.length, 6);
  const actualizacion = llamadas.find((llamada) => llamada.sql.startsWith('UPDATE'));
  assert.equal(actualizacion.valores[0], peligroso);
  assert.equal(actualizacion.valores[6], 1);
  const eliminacion = llamadas.find((llamada) => llamada.sql.startsWith('DELETE'));
  assert.deepEqual(eliminacion.valores, [1]);
});

test('el repositorio identifica registros inexistentes', async () => {
  const repository = crearTicketsRepository({
    async execute(sql) {
      return sql.startsWith('SELECT') ? [[]] : [{ affectedRows: 0 }];
    }
  });
  assert.equal(await repository.obtener(99), null);
  assert.equal(await repository.actualizar(99, datos), null);
  assert.equal(await repository.eliminar(99), false);
});
