import { pool } from '../../../config/db.pg.js';

export const ProveedoresDAO = {
  async selectAll({ limit, offset }) {
    const { rows } = await pool.query(
      `SELECT id_proveedor, cuit, nombre_empresa, contacto_nombre, telefono
       FROM proveedores
       WHERE activo = true
       ORDER BY id_proveedor DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  },

  async selectById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM proveedores WHERE id_proveedor = $1 AND activo = true`,
      [id]
    );
    return rows[0] || null;
  },

  async insert({ cuit, nombre_empresa, contacto_nombre, telefono }) {
    const { rows } = await pool.query(
      `INSERT INTO proveedores (cuit, nombre_empresa, contacto_nombre, telefono)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cuit, nombre_empresa, contacto_nombre || null, telefono || null]
    );
    return rows[0];
  },

  async update(id, { cuit, nombre_empresa, contacto_nombre, telefono }) {
    const { rows } = await pool.query(
      `UPDATE proveedores
       SET cuit = $1, nombre_empresa = $2, contacto_nombre = $3, telefono = $4
       WHERE id_proveedor = $5
       RETURNING *`,
      [cuit, nombre_empresa, contacto_nombre, telefono, id]
    );
    return rows[0];
  },

  async deleteSoft(id) {
    const { rows } = await pool.query(
      `UPDATE proveedores SET activo = false WHERE id_proveedor = $1
       RETURNING id_proveedor, nombre_empresa, activo`,
      [id]
    );
    return rows[0];
  },
};
