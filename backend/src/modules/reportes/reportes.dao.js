import { pool } from '../../../config/db.pg.js';

export const ReportesDAO = {
  async obtenerMetricasFinancieras() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [ventasHoy, ventasMes, metodosPago] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total, COUNT(id_venta) AS cantidad
         FROM ventas WHERE fecha >= $1`,
        [hoy]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total
         FROM ventas WHERE fecha >= $1`,
        [inicioMes]
      ),
      pool.query(
        `SELECT metodo_pago, COALESCE(SUM(total), 0) AS total, COUNT(id_venta) AS cantidad
         FROM ventas
         GROUP BY metodo_pago`
      ),
    ]);

    return {
      facturacion_hoy: Number(ventasHoy.rows[0].total),
      amount_sales_today: Number(ventasHoy.rows[0].cantidad),
      cantidad_ventas_hoy: Number(ventasHoy.rows[0].cantidad),
      facturacion_mes: Number(ventasMes.rows[0].total),
      metodos_pago: metodosPago.rows.map(m => ({
        metodo: m.metodo_pago,
        total: Number(m.total),
        cantidad: Number(m.cantidad),
      })),
    };
  },

  async obtenerTopVendedores() {
    const { rows } = await pool.query(
      `SELECT v.id_vendedor,
              COALESCE(ve.nombre_vendedor, 'Mostrador / Anonimo') AS nombre,
              COALESCE(SUM(v.total), 0) AS total_vendido,
              COUNT(v.id_venta) AS cantidad_ventas
       FROM ventas v
       LEFT JOIN vendedores ve ON ve.id_vendedor = v.id_vendedor
       GROUP BY v.id_vendedor, ve.nombre_vendedor
       ORDER BY total_vendido DESC
       LIMIT 5`
    );
    return rows.map(r => ({
      id_vendedor: r.id_vendedor,
      nombre: r.nombre,
      total_vendido: Number(r.total_vendido),
      cantidad_ventas: Number(r.cantidad_ventas),
    }));
  },

  async obtenerDeudoresCriticos() {
    const { rows } = await pool.query(
      `SELECT v.id_cliente,
              COALESCE(c.nombre_cliente, 'Cliente No Identificado') AS nombre_cliente,
              COALESCE(c.telefono::text, 'N/A') AS telefono,
              COALESCE(SUM(v.total), 0) AS saldo_deudor
       FROM ventas v
       LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
       WHERE v.metodo_pago = 'Cuenta Corriente'
       GROUP BY v.id_cliente, c.nombre_cliente, c.telefono
       ORDER BY saldo_deudor DESC
       LIMIT 5`
    );
    return rows.map(r => ({
      id_cliente: r.id_cliente,
      nombre_cliente: r.nombre_cliente,
      telefono: r.telefono,
      saldo_deudor: Number(r.saldo_deudor),
    }));
  },

  async obtenerComisionesDistribuidoresResumen() {
    const { rows } = await pool.query(
      `SELECT e.id_repartidor,
              COALESCE(r.nombre_repartidor, 'Desconocido') AS nombre_repartidor,
              COUNT(e.id_envio) AS entregas_pendientes_pago,
              COALESCE(SUM(v.total), 0) AS total_distribuido
       FROM envios e
       JOIN ventas v ON e.id_venta = v.id_venta
       LEFT JOIN repartidores r ON r.id_repartidor = e.id_repartidor
       WHERE e.comision_liquidada = false
         AND e.estado = 'Entregado'
       GROUP BY e.id_repartidor, r.nombre_repartidor
       ORDER BY total_distribuido DESC`
    );
    return rows.map(r => {
      const totalAcumulado = Number(r.total_distribuido);
      return {
        id_repartidor: r.id_repartidor,
        nombre: r.nombre_repartidor,
        entregas_pendientes_pago: Number(r.entregas_pendientes_pago),
        total_distribuido: totalAcumulado,
        comision_pendiente: Math.round(totalAcumulado * 0.10 * 100) / 100,
      };
    });
  },

  async obtenerVentasUltimos7Dias() {
    const { rows } = await pool.query(
      `SELECT
          gs.fecha::date AS fecha_dia,
          COALESCE(SUM(v.total), 0) AS total_dia
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS gs(fecha)
       LEFT JOIN ventas v ON v.fecha = gs.fecha::date
       GROUP BY gs.fecha
       ORDER BY gs.fecha ASC`
    );
    return rows.map(r => Number(r.total_dia));
  }
};