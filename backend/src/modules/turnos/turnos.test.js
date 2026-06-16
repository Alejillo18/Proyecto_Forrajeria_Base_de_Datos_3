import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TurnosService } from './turnos.service.js';
import { TurnosDAO } from './turnos.dao.js';
import { pool } from '../../../config/db.postgres.js';

describe('Módulo de Turnos y Cajas - Pruebas Híbridas (Mongo + Postgres)', () => {
  
  const fakeTurnoAbierto = {
    _id: '65f1a2b3c4d5e6f7a8b9c100',
    id_usuario: 10,
    monto_inicial: 5000,
    estado: 'abierto',
    fecha_apertura: new Date('2026-06-09T08:00:00.000Z')
  };

  beforeEach(() => {
    TurnosDAO.findActivoByUsuario = () => Promise.resolve(null);
    TurnosDAO.selectById = () => Promise.resolve(null);
    TurnosDAO.insert = () => Promise.resolve(null);
    TurnosDAO.update = () => Promise.resolve(null);
    pool.query = () => Promise.resolve({ rows: [] });
  });

  test('abrirTurno() - Debería iniciar la caja si el usuario no tiene otra activa', async () => {
    TurnosDAO.insert = async (inputDB) => {
      return { _id: '65f1a2b3c4d5e6f7a8b9c100', ...inputDB };
    };

    const resultado = await TurnosService.abrirTurno({ id_usuario: 10, monto_inicial: 5000 });
    
    assert.strictEqual(resultado.estado, 'abierto');
    assert.strictEqual(resultado.monto_inicial, 5000);
  });

  test('abrirTurno() - Debería lanzar error 400 si ya existe una caja abierta', async () => {
    TurnosDAO.findActivoByUsuario = async (id) => fakeTurnoAbierto;

    await assert.rejects(
      async () => {
        await TurnosService.abrirTurno({ id_usuario: 10, monto_inicial: 2000 });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.message, 'Ya cuentas con un turno de caja activo actualmente');
        return true;
      }
    );
  });

  test('cerrarTurno() - Debería calcular ventas llamando al SP de Postgres, cerrar en Mongo y arrojar cuadre', async () => {
    TurnosDAO.selectById = async (id) => fakeTurnoAbierto;

    pool.query = async (sql, params) => {
      assert.match(sql, /calcular_total_efectivo_turno/); 
      assert.strictEqual(params[0], 10);
      return { rows: [{ total: '15000.00' }] };
    };

    TurnosDAO.update = async (id, data) => {
      assert.strictEqual(data.estado, 'cerrado');
      assert.strictEqual(data.monto_final_esperado, 20000); 
      assert.strictEqual(data.monto_final_real, 20000);
      assert.strictEqual(data.diferencia_caja, 0); 
      return { _id: id, ...data };
    };

    const resultado = await TurnosService.cerrarTurno('65f1a2b3c4d5e6f7a8b9c100', {
      monto_final_real: 20000,
      auditoria_detalles: { notes: 'Cuadre perfecto' }
    });

    assert.strictEqual(resultado.diferencia_caja, 0);
  });

  test('cerrarTurno() - Debería calcular un faltante de caja si el dinero real es menor al esperado', async () => {
    TurnosDAO.selectById = async (id) => fakeTurnoAbierto;

    pool.query = async () => ({ rows: [{ total: '10000.00' }] });

    TurnosDAO.update = async (id, data) => {
      assert.strictEqual(data.monto_final_esperado, 15000);
      assert.strictEqual(data.monto_final_real, 14800); 
      assert.strictEqual(data.diferencia_caja, -200); 
      return { _id: id, ...data };
    };

    const resultado = await TurnosService.cerrarTurno('65f1a2b3c4d5e6f7a8b9c100', {
      monto_final_real: 14800
    });

    assert.strictEqual(resultado.diferencia_caja, -200);
  });
});