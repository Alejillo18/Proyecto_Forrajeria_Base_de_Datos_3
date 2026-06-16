import { pool } from '../../../config/db.pg.js';

export const ClientesDAO = {
  async selectAll({ limit, offset }) {
    const { rows } = await pool.query(
      `SELECT id_cliente, nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia, fecha_creacion
       FROM clientes
       WHERE activo = true
       ORDER BY fecha_creacion DESC, id_cliente DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  },

  async selectById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM clientes WHERE id_cliente = $1 AND activo = true`,
      [id]
    );
    return rows[0] || null;
  },

  async insert({ nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia }) {
    const { rows } = await pool.query(
      `INSERT INTO clientes (nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nombre_cliente, dni_cuit, telefono || null, direccion || null, email || null, id_membresia || null]
    );
    return rows[0];
  },

  async update(id, { nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia }) {
    const { rows } = await pool.query(
      `UPDATE clientes
       SET nombre_cliente = $1, dni_cuit = $2, telefono = $3, direccion = $4, email = $5, id_membresia = $6
       WHERE id_cliente = $7
       RETURNING *`,
      [nombre_cliente, dni_cuit, telefono || null, direccion || null, email || null, id_membresia || null, id]
    );
    return rows[0];
  },

  async deleteSoft(id) {
    const { rows } = await pool.query(
      `UPDATE clientes SET activo = false WHERE id_cliente = $1
       RETURNING id_cliente, nombre_cliente, activo`,
      [id]
    );
    return rows[0];
  },

  async obtenerSaldoDeudor(id_cliente) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM ventas
       WHERE id_cliente = $1 AND metodo_pago = 'Cuenta Corriente'`,
      [id_cliente]
    );
    return Number(rows[0].total);
  },

  async selectHistorialCuentaCorriente(id_cliente) {
    const { rows } = await pool.query(
      `SELECT id_venta, fecha, total, metodo_pago
       FROM ventas
       WHERE id_cliente = $1 AND metodo_pago = 'Cuenta Corriente'
       ORDER BY fecha DESC`,
      [id_cliente]
    );
    return rows;
  },
};
