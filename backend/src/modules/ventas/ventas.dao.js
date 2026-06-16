import { pool } from '../../../config/db.pg.js';

export const VentasDAO = {
  async insertarVentaTransaccional({ id_usuario, id_cliente, monto_total, metodo_pago, detalles }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: ventaRows } = await client.query(
        `INSERT INTO ventas (id_usuario, id_cliente, total, metodo_pago)
         VALUES ($1, $2, $3, $4)
         RETURNING id_venta, fecha`,
        [id_usuario, id_cliente || null, monto_total, metodo_pago]
      );
      const nuevaVenta = ventaRows[0];

      for (const item of detalles) {
        await client.query(
          `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario_historico)
           VALUES ($1, $2, $3, $4)`,
          [nuevaVenta.id_venta, item.id_producto, item.cantidad, item.precio_unitario_historico]
        );
      }

      await client.query('COMMIT');

      return {
        id_venta: nuevaVenta.id_venta,
        fecha: nuevaVenta.fecha,
        monto_total,
        metodo_pago,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async selectPendientesComisionByDistribuidor(id_usuario) {
    const { rows } = await pool.query(
      `SELECT v.id_venta, v.fecha, v.total AS monto_total
       FROM ventas v
       JOIN envios e ON e.id_venta = v.id_venta
       WHERE v.id_usuario = $1
         AND v.comision_liquidada = false
         AND e.estado = 'Entregado'
       ORDER BY v.fecha ASC`,
      [id_usuario]
    );
    return rows;
  },

  async updateComisionesALiquidadas(id_usuario) {
    const { rowCount } = await pool.query(
      `UPDATE ventas v
       SET comision_liquidada = true
       FROM envios e
       WHERE e.id_venta = v.id_venta
         AND v.id_usuario = $1
         AND v.comision_liquidada = false
         AND e.estado = 'Entregado'`,
      [id_usuario]
    );
    return { count: rowCount };
  },
};
