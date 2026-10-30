import '../src/env.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/database.js';

// Prueba explícita contra MySQL real: crea un ticket temporal y lo elimina al terminar.
test('CRUD real y persistencia después de reiniciar la API', { timeout: 30000 }, async () => {
  let proceso;
  let id;
  let url;

  async function iniciar() {
    const puertoLibre = createServer();
    puertoLibre.listen(0, '127.0.0.1');
    await once(puertoLibre, 'listening');
    const puerto = puertoLibre.address().port;
    await new Promise((resolve) => puertoLibre.close(resolve));
    proceso = spawn(process.execPath, ['src/server.js'], {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      env: { ...process.env, PORT: String(puerto) },
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
    });
    url = `http://localhost:${puerto}/api/tickets`;
    await new Promise((resolve, reject) => {
      const tiempo = setTimeout(() => reject(new Error('La API no inició a tiempo.')), 8000);
      proceso.once('error', (error) => { clearTimeout(tiempo); reject(error); });
      proceso.once('exit', (codigo) => { clearTimeout(tiempo); reject(new Error('La API terminó con código ' + codigo)); });
      proceso.stdout.on('data', (datos) => {
        if (datos.toString().includes('API de soporte')) { clearTimeout(tiempo); resolve(); }
      });
    });
  }

  async function detener() {
    if (proceso && proceso.exitCode === null) {
      const salida = once(proceso, 'exit');
      proceso.kill();
      await salida;
    }
  }

  try {
    await iniciar();
    const datos = {
      asunto: 'Prueba temporal de integración', solicitante: 'Prueba automática',
      descripcion: 'Verificación de CRUD con MySQL real', categoria: 'Software',
      prioridad: 'Media', estado: 'Abierto'
    };
    let respuesta = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
    });
    assert.equal(respuesta.status, 201);
    const creado = await respuesta.json();
    id = creado.id;
    assert.ok(Number.isInteger(id));
    assert.ok(creado.fechaRegistro);

    const [filas] = await pool.execute('SELECT asunto FROM tickets WHERE id = ?', [id]);
    assert.equal(filas[0].asunto, datos.asunto);
    respuesta = await fetch(url);
    assert.equal(respuesta.status, 200);
    assert.ok((await respuesta.json()).some((ticket) => ticket.id === id));

    respuesta = await fetch(url + '/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, estado: 'Cerrado' })
    });
    assert.equal(respuesta.status, 200);
    assert.equal((await respuesta.json()).estado, 'Cerrado');

    // Repetir la misma actualización debe funcionar aunque los datos no cambien.
    respuesta = await fetch(url + '/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, estado: 'Cerrado' })
    });
    assert.equal(respuesta.status, 200);

    await detener();
    await iniciar();
    respuesta = await fetch(url + '/' + id);
    assert.equal(respuesta.status, 200);
    assert.equal((await respuesta.json()).estado, 'Cerrado');

    respuesta = await fetch(url + '/' + id, { method: 'DELETE' });
    assert.equal(respuesta.status, 204);
    assert.equal((await fetch(url + '/' + id)).status, 404);
    const [restantes] = await pool.execute('SELECT id FROM tickets WHERE id = ?', [id]);
    assert.equal(restantes.length, 0);
  } finally {
    await detener();
    try {
      if (id) await pool.execute('DELETE FROM tickets WHERE id = ?', [id]);
    } finally {
      await pool.end();
    }
  }
});
