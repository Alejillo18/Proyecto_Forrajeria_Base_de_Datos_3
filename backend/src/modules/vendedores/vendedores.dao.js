import { pool } from '../../../config/db.pg.js';

export const VendedoresDAO = {
  async selectAll() {
    const { rows } = await pool.query(
      `SELECT * FROM vendedores ORDER BY nombre_vendedor ASC`
    );
    return rows;
  },

  async insert({ nombre_vendedor, comision_porcentaje }) {
    const { rows } = await pool.query(
      `INSERT INTO vendedores (nombre_vendedor, comision_porcentaje, activo)
       VALUES ($1, $2, true)
       RETURNING *`,
      [String(nombre_vendedor), Number(comision_porcentaje) || 0]
    );
    return rows[0];
  },

  async update(id, dataRecibida) {
    const campos = [];
    const valores = [];
    let i = 1;

    if (dataRecibida.nombre_vendedor != null) {
      campos.push(`nombre_vendedor = $${i++}`);
      valores.push(String(dataRecibida.nombre_vendedor));
    }
    if (dataRecibida.comision_porcentaje != null) {
      campos.push(`comision_porcentaje = $${i++}`);
      valores.push(Number(dataRecibida.comision_porcentaje));
    }
    if (dataRecibida.activo != null) {
      campos.push(`activo = $${i++}`);
      valores.push(String(dataRecibida.activo) === 'true' || dataRecibida.activo === true);
    }

    if (campos.length === 0) return null;

    valores.push(String(id).trim());
    const { rows } = await pool.query(
      `UPDATE vendedores SET ${campos.join(', ')} WHERE id_vendedor = $${i} RETURNING *`,
      valores
    );
    return rows[0];
  },
};
