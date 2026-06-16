import { pool } from '../../../config/db.pg.js';

export const UsuariosDAO = {
  async selectAll() {
    const { rows } = await pool.query(
      `SELECT id_usuario, email, rol, activo, fecha_creacion
       FROM usuarios
       ORDER BY fecha_creacion DESC`
    );
    return rows;
  },

  async selectByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM usuarios WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  async insert({ email, password, rol }) {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (email, password, rol, activo)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [email, password, rol || 'Empleado']
    );
    return rows[0];
  },

  async update(id, dataRecibida) {
    const campos = [];
    const valores = [];
    let i = 1;

    for (const [llave, valor] of Object.entries(dataRecibida)) {
      if (valor !== undefined) {
        campos.push(`${llave} = $${i++}`);
        valores.push(valor === '' ? null : valor);
      }
    }

    if (campos.length === 0) return null;

    valores.push(id);
    const { rows } = await pool.query(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id_usuario = $${i}
       RETURNING id_usuario, email, rol, activo`,
      valores
    );
    return rows[0];
  },
};
