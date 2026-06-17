import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ProveedoresService } from './proveedores.service.js';
import { ProveedoresDAO } from './proveedores.dao.js';
import { redisClient } from '../../../config/db.redis.js';

describe('Módulo de Proveedores - Pruebas Unitarias (Servicio)', () => {
  const fakeProveedor = {
    id_proveedor: '00000000-0000-0000-0000-000000000001',
    cuit: 20123456789n,
    nombre_empresa: 'Forrajería El Molino',
    contacto_nombre: 'Juan Pérez',
    telefono: '3548123456',
    activo: true
  };
  const fakeListaProveedores = [fakeProveedor];

  beforeEach(() => {
    redisClient.get = () => Promise.resolve(null);
    redisClient.set = () => Promise.resolve('OK');
    redisClient.keys = () => Promise.resolve([]);
    redisClient.del = () => Promise.resolve(0);
    ProveedoresDAO.selectAll = () => Promise.resolve([]);
    ProveedoresDAO.selectById = () => Promise.resolve(null);
    ProveedoresDAO.insert = () => Promise.resolve(null);
    ProveedoresDAO.update = () => Promise.resolve(null);
    ProveedoresDAO.deleteSoft = () => Promise.resolve(null);
  });

  test('getAll() - Debería traer datos de PostgreSQL si Redis está vacío y luego cachear', async () => {
    ProveedoresDAO.selectAll = async ({ limit, offset }) => {
      assert.strictEqual(limit, 20);
      assert.strictEqual(offset, 0);
      return fakeListaProveedores;
    };
    let cacheGuardada = false;
    redisClient.set = async (key, value) => {
      assert.match(key, /^proveedores:page:1:limit:20/);
      cacheGuardada = true;
      return 'OK';
    };
    const resultado = await ProveedoresService.getAll({ page: 1, limit: 20 });
    assert.strictEqual(resultado.origen, 'PostgreSQL');
    assert.strictEqual(resultado.datos.length, 1);
    assert.strictEqual(resultado.datos[0].nombre_empresa, 'Forrajería El Molino');
    assert.strictEqual(cacheGuardada, true, 'El servicio debió guardar los datos en Redis');
  });

  test('getAll() - Debería retornar datos directamente de Redis si existen', async () => {
    const fakeCacheData = {
      pag: 1,
      limite: 20,
      datos: fakeListaProveedores
    };
    redisClient.get = async (key) => JSON.stringify(fakeCacheData);
    ProveedoresDAO.selectAll = () => {
      assert.fail('No debería haber consultado el DAO si los datos estaban en Redis');
    };
    const resultado = await ProveedoresService.getAll({ page: 1, limit: 20 });
    assert.strictEqual(resultado.origen, 'Redis');
    assert.strictEqual(resultado.datos[0].nombre_empresa, 'Forrajería El Molino');
  });

  test('getById() - Debería retornar un proveedor por su ID desde el DAO', async () => {
    ProveedoresDAO.selectById = async (id) => {
      assert.strictEqual(id, '00000000-0000-0000-0000-000000000001');
      return fakeProveedor;
    };
    const resultado = await ProveedoresService.getById('00000000-0000-0000-0000-000000000001');
    assert.deepStrictEqual(resultado, fakeProveedor);
  });
  
  test('create() - Debería insertar un proveedor e invalidar la caché de Redis', async () => {
    const nuevoInput = {
      cuit: 20999999999n,
      nombre_empresa: 'Distribuidora Royal',
      contacto_nombre: 'Carlos',
      telefono: '3548999999'
    };
    ProveedoresDAO.insert = async (inputDB) => {
      return { id_proveedor: '00000000-0000-0000-0000-000000000002', ...inputDB, activo: true };
    };

    let cacheInvalidada = false;
    redisClient.keys = async (pattern) => ['proveedores:page:1:limit:20'];
    redisClient.del = async (keys) => {
      cacheInvalidada = true;
      return 1;
    };
    const resultado = await ProveedoresService.create(nuevoInput);
    assert.strictEqual(resultado.id_proveedor, '00000000-0000-0000-0000-000000000002');
    assert.strictEqual(resultado.nombre_empresa, 'Distribuidora Royal');
    assert.strictEqual(cacheInvalidada, true, 'La caché no fue limpiada tras el insert');
  });

  test('update() - Debería actualizar datos a través del DAO e invalidar la caché', async () => {
    ProveedoresDAO.update = async (id, data) => {
      return { id_proveedor: id, ...data, activo: true };
    };

    let cacheInvalidada = false;
    redisClient.keys = async () => ['proveedores:page:1:limit:20'];
    redisClient.del = async () => { cacheInvalidada = true; return 1; };

    const resultado = await ProveedoresService.update('00000000-0000-0000-0000-000000000001', { nombre_empresa: 'Molino Actualizado' });

    assert.strictEqual(resultado.nombre_empresa, 'Molino Actualizado');
    assert.strictEqual(cacheInvalidada, true);
  });

  test('delete() - Debería aplicar baja lógica al proveedor e invalidar la caché', async () => {
    ProveedoresDAO.deleteSoft = async (id) => {
      return { id_proveedor: id, nombre_empresa: 'Baja', activo: false };
    };

    let cacheInvalidada = false;
    redisClient.keys = async () => ['proveedores:page:1:limit:20'];
    redisClient.del = async () => { cacheInvalidada = true; return 1; };

    const resultado = await ProveedoresService.delete('00000000-0000-0000-0000-000000000001');

    assert.strictEqual(resultado.activo, false);
    assert.strictEqual(cacheInvalidada, true);
  });
});