import '../src/env.js';
import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';

const nombre = process.env.DB_NAME || 'soporte_tecnico';
let conexion;

try {
  if (!/^[a-zA-Z0-9_]+$/.test(nombre) || nombre.length > 64) {
    throw new Error('DB_NAME solo admite letras, números y guion bajo, hasta 64 caracteres.');
  }
  conexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });
  const archivo = await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
  const sql = archivo.replaceAll('soporte_tecnico', '`' + nombre + '`');
  for (const sentencia of sql.split(';')) {
    if (sentencia.trim()) await conexion.query(sentencia);
  }
  console.log(`Base de datos ${nombre} y tabla tickets listas. Los registros existentes se conservan.`);
} catch (error) {
  console.error('No se pudo preparar MySQL:', error.code || error.message);
  process.exitCode = 1;
} finally {
  if (conexion) await conexion.end();
}
