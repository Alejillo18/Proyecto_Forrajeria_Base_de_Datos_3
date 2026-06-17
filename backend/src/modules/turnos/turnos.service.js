import { TurnosDAO } from './turnos.dao.js';
import { pool } from '../../../config/db.postgres.js';

export const TurnosService = {
  async getActivo(id_usuario) {
    return await TurnosDAO.findActivoByUsuario(id_usuario);
  },

  async abrirTurno({ id_usuario, monto_inicial }) {
    const turnoExistente = await TurnosDAO.findActivoByUsuario(id_usuario);
    if (turnoExistente) {
      const error = new Error('Ya cuentas con un turno de caja activo actualmente');
      error.status = 400;
      throw error;
    }

    return await TurnosDAO.insert({
      id_usuario,
      monto_inicial,
      estado: 'abierto',
      fecha_apertura: new Date()
    });
  },

  async cerrarTurno(id_turno, { monto_final_real, auditoria_detalles }) {
    const turno = await TurnosDAO.selectById(id_turno);
    if (!turno || turno.estado === 'cerrado') {
      const error = new Error('El turno no existe o ya se encuentra cerrado');
      error.status = 404;
      throw error;
    }

    let totalVentasEfectivo = 0;
    try {
      const sqlCall = 'SELECT calcular_total_efectivo_turno($1, $2) AS total;';
      const resultPostgres = await pool.query(sqlCall, [turno.id_usuario, turno.fecha_apertura]);
      totalVentasEfectivo = parseFloat(resultPostgres.rows[0].total) || 0;
    } catch (pgError) {
      console.error('Error al ejecutar procedimiento en Postgres:', pgError.message);
      const error = new Error('Fallo crítico al calcular el arqueo desde la base de datos relacional');
      error.status = 500;
      throw error;
    }

    const monto_final_esperado = turno.monto_inicial + totalVentasEfectivo;
    const diferencia_caja = monto_final_real - monto_final_esperado;

    return await TurnosDAO.update(id_turno, {
      fecha_cierre: new Date(),
      monto_final_esperado,
      monto_final_real,
      diferencia_caja,
      estado: 'cerrado',
      auditoria_detalles: auditoria_detalles || {}
    });
  },

  async getAll({ page, limit }) {
    const offset = (page - 1) * limit;
    return await TurnosDAO.selectAll({ limit, offset });
  }
};