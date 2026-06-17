import { pool } from '../../../config/db.pg.js';

export const ClientesDAO = {
  async selectAll({ limit, offset }) {
    const { rows } = await pool.query(
      `SELECT * FROM clientes WHERE activo = true ORDER BY nombre_cliente LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  },

  async selectById(id_cliente) {
    const { rows } = await pool.query(
      `SELECT * FROM clientes WHERE id_cliente = $1 AND activo = true`,
      [id_cliente]
    );
    return rows[0] || null;
  },

  async insert(data) {
    const { id_cliente, nombre_cliente, dni_cuit, telefono, direccion, email } = data;
    const { rows } = await pool.query(
      `INSERT INTO clientes (id_cliente, nombre_cliente, dni_cuit, telefono, direccion, email, activo)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [id_cliente, nombre_cliente, dni_cuit, telefono, direccion, email]
    );
    return rows[0];
  },

  async update(id_cliente, campos) {
    const listaCampos = [];
    const valores = [];
    let contador = 1;

    if (campos.nombre_cliente !== undefined) {
      listaCampos.push(`nombre_cliente = $${contador}`);
      valores.push(campos.nombre_cliente);
      contador++;
    }

    if (campos.dni_cuit !== undefined) {
      listaCampos.push(`dni_cuit = $${contador}`);
      valores.push(campos.dni_cuit);
      contador++;
    }

    if (campos.telefono !== undefined) {
      listaCampos.push(`telefono = $${contador}`);
      valores.push(campos.telefono);
      contador++;
    }

    if (campos.direccion !== undefined) {
      listaCampos.push(`direccion = $${contador}`);
      valores.push(campos.direccion);
      contador++;
    }

    if (campos.email !== undefined) {
      listaCampos.push(`email = $${contador}`);
      valores.push(campos.email);
      contador++;
    }

    if (listaCampos.length === 0) {
      const { rows } = await pool.query(
        `SELECT * FROM clientes WHERE id_cliente = $1 AND activo = true`,
        [id_cliente]
      );
      return rows[0];
    }

    valores.push(id_cliente);
    const queryStr = `
      UPDATE clientes 
      SET ${listaCampos.join(', ')} 
      WHERE id_cliente = $${contador} AND activo = true
      RETURNING *
    `;

    const { rows } = await pool.query(queryStr, valores);
    return rows[0];
  },

  async deleteSoft(id_cliente) {
    const { rows } = await pool.query(
      `UPDATE clientes SET activo = false WHERE id_cliente = $1 AND activo = true RETURNING *`,
      [id_cliente]
    );
    return rows[0] || null;
  },

  async obtenerSaldoDeudor(id_cliente) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as saldo FROM ventas WHERE id_cliente = $1 AND metodo_pago = 'Cuenta Corriente'`,
      [id_cliente]
    );
    return Number(rows[0].saldo);
  },

  async selectHistorialCuentaCorriente(id_cliente) {
    const { rows } = await pool.query(
      `SELECT id_venta, fecha, total, metodo_pago FROM ventas WHERE id_cliente = $1 ORDER BY fecha DESC`,
      [id_cliente]
    );
    return rows;
  }
};