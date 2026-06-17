import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TurnosService } from './turnos.service.js';
import { TurnosDAO } from './turnos.dao.js';
import { pool } from '../../../config/db.postgres.js';

const fakeTurnoAbierto = {
  _id: '65f1a2b3c4d5e6f7a8b9c100',
  id_usuario: 10,
  monto_inicial: 5000,
  estado: 'abierto',
  fecha_apertura: new Date('2026-06-09T08:00:00.000Z')
};

describe('Módulo Turnos — Apertura y Cierre de Caja', () => {

  beforeEach(() => {
    TurnosDAO.findActivoByUsuario = () => Promise.resolve(null);
    TurnosDAO.selectById          = () => Promise.resolve(null);
    TurnosDAO.insert              = () => Promise.resolve(null);
    TurnosDAO.update              = () => Promise.resolve(null);
    TurnosDAO.selectAll           = () => Promise.resolve({ datos: [], total: 0 });
    pool.query                    = () => Promise.resolve({ rows: [{ total: '10000.00' }] });
  });

  test('abrirTurno() — Crea el turno si no hay ninguno activo', async () => {
    TurnosDAO.insert = async (data) => ({ _id: 'nuevo-id', ...data });
    const r = await TurnosService.abrirTurno({ id_usuario: 10, monto_inicial: 5000 });
    assert.strictEqual(r.estado, 'abierto');
    assert.strictEqual(r.monto_inicial, 5000);
  });

  test('abrirTurno() — Persiste id_usuario y fecha_apertura como Date', async () => {
    TurnosDAO.insert = async (data) => {
      assert.strictEqual(data.id_usuario, 42);
      assert.ok(data.fecha_apertura instanceof Date);
      return { _id: 'nuevo', ...data };
    };
    await TurnosService.abrirTurno({ id_usuario: 42, monto_inicial: 3000 });
  });

  test('abrirTurno() — Lanza 400 si ya hay un turno activo', async () => {
    TurnosDAO.findActivoByUsuario = async () => fakeTurnoAbierto;
    await assert.rejects(
      () => TurnosService.abrirTurno({ id_usuario: 10, monto_inicial: 2000 }),
      (err) => { assert.strictEqual(err.status, 400); return true; }
    );
  });

  test('cerrarTurno() — Calcula diferencia_caja 0 cuando real == esperado', async () => {
    TurnosDAO.selectById = async () => fakeTurnoAbierto;
    pool.query = async () => ({ rows: [{ total: '15000.00' }] });
    TurnosDAO.update = async (id, data) => ({ _id: id, ...data });

    const r = await TurnosService.cerrarTurno('65f1a2b3c4d5e6f7a8b9c100', { monto_final_real: 20000 });
    assert.strictEqual(r.diferencia_caja, 0);
    assert.strictEqual(r.estado, 'cerrado');
  });

  test('cerrarTurno() — Calcula faltante de caja (diferencia negativa)', async () => {
    TurnosDAO.selectById = async () => fakeTurnoAbierto;
    pool.query = async () => ({ rows: [{ total: '10000.00' }] });
    TurnosDAO.update = async (id, data) => ({ _id: id, ...data });

    const r = await TurnosService.cerrarTurno('65f1a2b3c4d5e6f7a8b9c100', { monto_final_real: 14800 });
    assert.strictEqual(r.diferencia_caja, -200);
  });

  test('cerrarTurno() — Calcula sobrante de caja (diferencia positiva)', async () => {
    TurnosDAO.selectById = async () => fakeTurnoAbierto;
    pool.query = async () => ({ rows: [{ total: '10000.00' }] });
    TurnosDAO.update = async (id, data) => ({ _id: id, ...data });

    const r = await TurnosService.cerrarTurno('65f1a2b3c4d5e6f7a8b9c100', { monto_final_real: 15500 });
    assert.strictEqual(r.diferencia_caja, 500);
  });

  test('cerrarTurno() — Lanza 404 si el turno no existe', async () => {
    TurnosDAO.selectById = async () => null;
    await assert.rejects(
      () => TurnosService.cerrarTurno('turno-inexistente', { monto_final_real: 5000 }),
      (err) => { assert.strictEqual(err.status, 404); return true; }
    );
  });

  test('cerrarTurno() — Lanza 404 si el turno ya estaba cerrado', async () => {
    TurnosDAO.selectById = async () => ({ ...fakeTurnoAbierto, estado: 'cerrado' });
    await assert.rejects(
      () => TurnosService.cerrarTurno('65f1a2b3c4d5e6f7a8b9c100', { monto_final_real: 5000 }),
      (err) => { assert.strictEqual(err.status, 404); return true; }
    );
  });

  test('cerrarTurno() — Lanza 500 si falla el stored procedure de Postgres', async () => {
    TurnosDAO.selectById = async () => fakeTurnoAbierto;
    pool.query = async () => { throw new Error('connection refused'); };
    await assert.rejects(
      () => TurnosService.cerrarTurno('65f1a2b3c4d5e6f7a8b9c100', { monto_final_real: 5000 }),
      (err) => { assert.strictEqual(err.status, 500); return true; }
    );
  });

  test('getActivo() — Delega en el DAO y retorna el turno activo', async () => {
    TurnosDAO.findActivoByUsuario = async (id) => { assert.strictEqual(id, 10); return fakeTurnoAbierto; };
    const r = await TurnosService.getActivo(10);
    assert.strictEqual(r.estado, 'abierto');
  });

  test('getAll() — Calcula el offset de paginación correctamente', async () => {
    TurnosDAO.selectAll = async ({ limit, offset }) => {
      assert.strictEqual(limit, 10);
      assert.strictEqual(offset, 20);
      return { datos: [fakeTurnoAbierto], total: 1 };
    };
    const r = await TurnosService.getAll({ page: 3, limit: 10 });
    assert.ok(r.datos || Array.isArray(r));
  });
});