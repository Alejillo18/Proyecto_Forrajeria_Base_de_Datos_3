import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ClientesService } from './clientes.service.js';
import { ClientesDAO } from './clientes.dao.js';
import { redisClient } from '../../../config/db.redis.js';

describe('Módulo de Clientes - Pruebas Unitarias (Servicio)', () => {
  const fakeCliente = {
    id_cliente: '00000000-0000-0000-0000-000000000001',  
    nombre_cliente: 'cliente1',
    dni_cuit: 20456789123n,
    telefono: '3548112233',
    direccion: 'La Falda, Córdoba',
    email: 'cliente@example.com',
    id_membresia: '00000000-0000-0000-0000-000000000002',
    activo: true
  };

  const fakeListaClientes = [fakeCliente];

  const fakeHistorialCC = [
    {
      id_venta: 'v-001',
      fecha: new Date('2026-06-01T10:00:00.000Z'),
      total: 45000,
      metodo_pago: 'Cuenta Corriente'
    }
  ];

  beforeEach(() => {
    redisClient.get = () => Promise.resolve(null);
    redisClient.set = () => Promise.resolve('OK');
    redisClient.keys = () => Promise.resolve([]);
    redisClient.del = () => Promise.resolve(0);
    ClientesDAO.selectAll = () => Promise.resolve([]);
    ClientesDAO.selectById = () => Promise.resolve(null);
    ClientesDAO.insert = () => Promise.resolve(null);
    ClientesDAO.update = () => Promise.resolve(null);
    ClientesDAO.deleteSoft = () => Promise.resolve(null);
    ClientesDAO.obtenerSaldoDeudor = () => Promise.resolve(0);
    ClientesDAO.selectHistorialCuentaCorriente = () => Promise.resolve([]);
  });

  test('getAll() - Debería traer datos de PostgreSQL si Redis está vacío y guardarlos en caché', async () => {
    ClientesDAO.selectAll = async ({ limit, offset }) => {
      assert.strictEqual(limit, 10);
      assert.strictEqual(offset, 0);
      return fakeListaClientes;
    };
    let cacheGuardada = false;
    redisClient.set = async (key, value) => {
      assert.match(key, /^clientes:page:1:limit:10/);
      cacheGuardada = true;
      return 'OK';
    };
    const resultado = await ClientesService.getAll({ page: 1, limit: 10 });
    assert.strictEqual(resultado.origen, 'PostgreSQL');
    assert.strictEqual(resultado.datos.length, 1);
    assert.strictEqual(resultado.datos[0].nombre_cliente, 'cliente1');
    assert.strictEqual(cacheGuardada, true);
  });

  test('getAll() - Debería responder directamente desde Redis si el dato ya está cacheado', async () => {
    const fakeCache = {
      pag: 1,
      limite: 10,
      datos: fakeListaClientes
    };
    redisClient.get = async (key) => JSON.stringify(fakeCache);
    ClientesDAO.selectAll = () => {
      assert.fail('No debió consultar PostgreSQL si el dato existía en la caché de Redis');
    };
    const resultado = await ClientesService.getAll({ page: 1, limit: 10 });
    assert.strictEqual(resultado.origen, 'Redis');
    assert.strictEqual(resultado.datos[0].nombre_cliente, 'cliente1');
  });

  test('getById() - Debería retornar el cliente específico consultando al DAO', async () => {
    ClientesDAO.selectById = async (id) => {
      assert.strictEqual(id, '00000000-0000-0000-0000-000000000001');
      return fakeCliente;
    };
    const resultado = await ClientesService.getById('00000000-0000-0000-0000-000000000001');
    assert.deepStrictEqual(resultado, fakeCliente);
  });

  test('create() - Debería persistir el nuevo cliente e invalidar la caché de clientes', async () => {
    const inputNuevo = {
      nombre_cliente: 'Gaston',
      dni_cuit: 20999999999n
    };
    ClientesDAO.insert = async (inputDB) => {
      return { id_cliente: '00000000-0000-0000-0000-000000000002', ...inputDB, activo: true };
    };
    let cacheInvalidada = false;
    redisClient.keys = async (pattern) => ['clientes:page:1:limit:20'];
    redisClient.del = async (keys) => {
      cacheInvalidada = true;
      return 1;
    };
    const resultado = await ClientesService.create(inputNuevo);
    assert.strictEqual(resultado.id_cliente, '00000000-0000-0000-0000-000000000002');
    assert.strictEqual(resultado.nombre_cliente, 'Gaston');
    assert.strictEqual(cacheInvalidada, true, 'La mutación no limpió las keys de Redis');
  });

  test('update() - Debería actualizar mediante el DAO e invalidar las keys de Redis', async () => {
    ClientesDAO.update = async (id, data) => {
      return { id_cliente: id, ...data, activo: true };
    };

    let cacheInvalidada = false;
    redisClient.keys = async () => ['clientes:page:1:limit:10'];
    redisClient.del = async () => { cacheInvalidada = true; return 1; };
    const resultado = await ClientesService.update('00000000-0000-0000-0000-000000000001', { nombre_cliente: 'Nombre Modificado' });
    assert.strictEqual(resultado.nombre_cliente, 'Nombre Modificado');
    assert.strictEqual(cacheInvalidada, true);
  });

  test('delete() - Debería aplicar el soft-delete en DB e invalidar la caché', async () => {
    ClientesDAO.deleteSoft = async (id) => {
      return { id_cliente: id, nombre_cliente: 'Borrado', activo: false };
    };
    let cacheInvalidada = false;
    redisClient.keys = async () => ['clientes:page:1:limit:10'];
    redisClient.del = async () => { cacheInvalidada = true; return 1; };
    const resultado = await ClientesService.delete('00000000-0000-0000-0000-000000000001');
    assert.strictEqual(resultado.activo, false);
    assert.strictEqual(cacheInvalidada, true);
  });

  test('obtenerDetalleCuentaCorriente() - Debería integrar metadatos, saldo deudor y parsear BigInt a String', async () => {
    ClientesDAO.selectById = async () => fakeCliente;
    ClientesDAO.obtenerSaldoDeudor = async () => 45000;
    ClientesDAO.selectHistorialCuentaCorriente = async () => fakeHistorialCC;

    const resultado = await ClientesService.obtenerDetalleCuentaCorriente('00000000-0000-0000-0000-000000000001');

    assert.strictEqual(resultado.id_cliente, '00000000-0000-0000-0000-000000000001');
    assert.strictEqual(typeof resultado.dni_cuit, 'string');
    assert.strictEqual(resultado.dni_cuit, '20456789123');
    assert.strictEqual(resultado.saldo_deudor, 45000);
    assert.strictEqual(resultado.historial.length, 1);
    assert.strictEqual(resultado.historial[0].id_venta, 'v-001');
  });

  test('obtenerDetalleCuentaCorriente() - Debería lanzar error 404 si el cliente no existe o está inactivo', async () => {
    ClientesDAO.selectById = async () => null;

    await assert.rejects(
      async () => {
        await ClientesService.obtenerDetalleCuentaCorriente('00000000-0000-0000-0000-000000000999');
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Cliente no encontrado o inactivo');
        return true;
      }
    );
  });
});