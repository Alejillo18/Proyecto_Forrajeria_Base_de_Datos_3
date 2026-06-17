import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ProveedoresService } from './proveedores.service.js';
import { ProveedoresDAO } from './proveedores.dao.js';
import { redisClient } from '../../../config/db.redis.js';

const fakeProveedor = {
  id_proveedor: '00000000-0000-0000-0000-000000000001',
  cuit: '20123456789',
  nombre_empresa: 'Forrajería El Molino',
  contacto_nombre: 'Juan Pérez',
  telefono: '3548123456',
  activo: true
};

describe('Módulo Proveedores — CRUD con caché Redis', () => {

  beforeEach(() => {
    redisClient.get  = () => Promise.resolve(null);
    redisClient.set  = () => Promise.resolve('OK');
    redisClient.keys = () => Promise.resolve([]);
    redisClient.del  = () => Promise.resolve(0);
    ProveedoresDAO.selectAll  = () => Promise.resolve([]);
    ProveedoresDAO.selectById = () => Promise.resolve(null);
    ProveedoresDAO.insert     = () => Promise.resolve(null);
    ProveedoresDAO.update     = () => Promise.resolve(null);
    ProveedoresDAO.deleteSoft = () => Promise.resolve(null);
  });

  test('getAll() — Consulta el DAO si Redis no tiene datos y luego cachea', async () => {
    ProveedoresDAO.selectAll = async () => [fakeProveedor];
    let cacheGuardada = false;
    redisClient.set = async (key) => { cacheGuardada = true; return 'OK'; };

    const resultado = await ProveedoresService.getAll({ page: 1, limit: 20 });

    assert.strictEqual(resultado.origen, 'PostgreSQL');
    assert.strictEqual(resultado.datos.length, 1);
    assert.strictEqual(cacheGuardada, true);
  });

  test('getAll() — Retorna datos de Redis si ya existen (sin llamar al DAO)', async () => {
    const cache = { pag: 1, limite: 20, datos: [fakeProveedor] };
    redisClient.get = async () => JSON.stringify(cache);
    ProveedoresDAO.selectAll = () => { assert.fail('No debería llamar al DAO'); };

    const resultado = await ProveedoresService.getAll({ page: 1, limit: 20 });
    assert.strictEqual(resultado.origen, 'Redis');
    assert.strictEqual(resultado.datos[0].nombre_empresa, 'Forrajería El Molino');
  });

  test('getById() — Retorna el proveedor cuando existe', async () => {
    ProveedoresDAO.selectById = async (id) => fakeProveedor;
    const resultado = await ProveedoresService.getById('00000000-0000-0000-0000-000000000001');
    assert.deepStrictEqual(resultado, fakeProveedor);
  });

  test('getById() — Retorna null si el proveedor no existe', async () => {
    ProveedoresDAO.selectById = async () => null;
    const resultado = await ProveedoresService.getById('id-inexistente');
    assert.strictEqual(resultado, null);
  });

  test('create() — Inserta el proveedor e invalida la caché', async () => {
    ProveedoresDAO.insert = async (data) => ({ id_proveedor: 'nuevo-id', ...data, activo: true });
    let cacheInvalidada = false;
    redisClient.keys = async () => ['proveedores:page:1:limit:20'];
    redisClient.del  = async () => { cacheInvalidada = true; return 1; };

    const resultado = await ProveedoresService.create({ nombre_empresa: 'Nueva Distribuidora' });
    assert.strictEqual(resultado.id_proveedor, 'nuevo-id');
    assert.strictEqual(cacheInvalidada, true);
  });

  test('update() — Actualiza e invalida la caché si el DAO encontró el registro', async () => {
    ProveedoresDAO.update = async (id, data) => ({ id_proveedor: id, ...data });
    let cacheInvalidada = false;
    redisClient.keys = async () => ['key'];
    redisClient.del  = async () => { cacheInvalidada = true; return 1; };

    await ProveedoresService.update('00000000-0000-0000-0000-000000000001', { nombre_empresa: 'Molino Actualizado' });
    assert.strictEqual(cacheInvalidada, true);
  });

  test('update() — No invalida la caché si el DAO retornó null', async () => {
    ProveedoresDAO.update = async () => null;
    let cacheInvalidada = false;
    redisClient.del = async () => { cacheInvalidada = true; return 1; };

    await ProveedoresService.update('id-inexistente', { nombre_empresa: 'Fantasma' });
    assert.strictEqual(cacheInvalidada, false);
  });

  test('delete() — Aplica baja lógica e invalida la caché', async () => {
    ProveedoresDAO.deleteSoft = async (id) => ({ id_proveedor: id, activo: false });
    let cacheInvalidada = false;
    redisClient.keys = async () => ['key'];
    redisClient.del  = async () => { cacheInvalidada = true; return 1; };

    const resultado = await ProveedoresService.delete('00000000-0000-0000-0000-000000000001');
    assert.strictEqual(resultado.activo, false);
    assert.strictEqual(cacheInvalidada, true);
  });

  test('delete() — No invalida la caché si el proveedor no fue encontrado', async () => {
    ProveedoresDAO.deleteSoft = async () => null;
    let cacheInvalidada = false;
    redisClient.del = async () => { cacheInvalidada = true; return 1; };

    await ProveedoresService.delete('id-inexistente');
    assert.strictEqual(cacheInvalidada, false);
  });
});
