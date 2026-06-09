import { prisma } from '../../../config/db.prisma.js';

export const ReportesDAO = {
  async obtenerMetricasFinancieras() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [ventasHoy, ventasMes, metodosPago] = await Promise.all([
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id_venta: true },
        where: { fecha: { gte: hoy } }
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        where: {
          fecha: {
            gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1)
          }
        }
      }),
      prisma.venta.groupBy({
        by: ['metodo_pago'],
        _sum: { total: true },
        _count: { id_venta: true }
      })
    ]);

    return {
      facturacion_hoy: Number(ventasHoy._sum.total || 0),
      amount_sales_today: ventasHoy._count.id_venta,
      cantidad_ventas_hoy: ventasHoy._count.id_venta,
      facturacion_mes: Number(ventasMes._sum.total || 0),
      metodos_pago: metodosPago.map(m => ({
        metodo: m.metodo_pago,
        total: Number(m._sum.total || 0),
        cantidad: m._count.id_venta
      }))
    };
  },

  async obtenerTopVendedores() {
    const ranking = await prisma.venta.groupBy({
      by: ['id_vendedor'],
      _sum: { total: true },
      _count: { id_venta: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    });

    const vendedoresIds = ranking.map(r => r.id_vendedor).filter(Boolean);

    const vendedoresInfo = await prisma.vendedor.findMany({
      where: { id_vendedor: { in: vendedoresIds } },
      select: { id_vendedor: true, nombre_vendedor: true }
    });

    return ranking.map(r => {
      const info = vendedoresInfo.find(v => v.id_vendedor === r.id_vendedor);
      return {
        id_vendedor: r.id_vendedor,
        nombre: info ? info.nombre_vendedor : 'Mostrador / Anonimo',
        total_vendido: Number(r._sum.total || 0),
        cantidad_ventas: r._count.id_venta
      };
    });
  },

  async obtenerDeudoresCriticos() {

    const ventasDeudores = await prisma.venta.groupBy({
      by: ['id_cliente'],
      _sum: { total: true },
      where: { metodo_pago: 'Cuenta Corriente' },
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    });

    const clientesIds = ventasDeudores.map(d => d.id_cliente).filter(Boolean);

    const infoClientes = await prisma.cliente.findMany({
      where: { id_cliente: { in: clientesIds } },
      select: { id_cliente: true, nombre_cliente: true, telefono: true }
    });

    return ventasDeudores.map(d => {
      const info = infoClientes.find(c => c.id_cliente === d.id_cliente);
      return {
        id_cliente: d.id_cliente,
        nombre_cliente: info ? info.nombre_cliente : 'Cliente No Identificado',
        telefono: info ? info.telefono : 'N/A',
        saldo_deudor: Number(d._sum.total || 0)
      };
    });
  },

  async obtenerComisionesDistribuidoresResumen() {

    const agrupacionRepartidores = await prisma.venta.groupBy({
      by: ['id_usuario'],
      _sum: { total: true },
      _count: { id_venta: true },
      where: {
        comision_liquidada: false,
        envio: { estado: 'Entregado' }
      },
      orderBy: { _sum: { total: 'desc' } }
    });

    return agrupacionRepartidores.map(r => {
      const totalAcumulado = Number(r._sum.total || 0);
      return {
        id_usuario: r.id_usuario,
        entregas_pendientes_pago: r._count.id_venta,
        total_distribuido: totalAcumulado,
        comision_pendiente: Math.round((totalAcumulado * 0.10) * 100) / 100
      };
    });
  }
};