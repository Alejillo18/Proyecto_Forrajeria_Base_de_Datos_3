import { ReportesDAO } from './reportes.dao.js';
import { Producto } from '../productos/productos.model.js';

export const ReportesService = {
  async obtenerDashboardCompleto() {
    const metricasFinancieras = await ReportesDAO.obtenerMetricasFinancieras();
    const topVendedores = await ReportesDAO.obtenerTopVendedores();
    const deudoresCriticos = await ReportesDAO.obtenerDeudoresCriticos();
    const comisionesDistribuidores = await ReportesDAO.obtenerComisionesDistribuidoresResumen();
    const ventasDiarias = await ReportesDAO.obtenerVentasUltimos7Dias();
    
    const productosCriticos = await Producto.find({
      activo: true,
      $or: [
        { stock_bolsas_cerradas: { $lte: 3 } },
        { stock_kilos_granel: { $eq: 0 } }
      ]
    }).select('sku nombre_producto stock_bolsas_cerradas stock_kilos_granel');

    return {
      financiero: metricasFinancieras,
      ranking_vendedores: topVendedores,
      riesgo_credito: {
        descripcion: 'Top 5 Clientes con mayor deuda acumulada en Cuenta Corriente',
        deudores: deudoresCriticos
      },
      logistica_distribucion: {
        descripcion: 'Comisiones pendientes de liquidar por repartidor (10% de entregas exitosas)',
        resumen_repartidores: comisionesDistribuidores
      },
      alertas_stock: productosCriticos.map(p => ({
        id_producto: p._id,
        sku: p.sku,
        nombre: p.nombre_producto,
        bolsas: p.stock_bolsas_cerradas,
        kilos_granel: p.stock_kilos_granel,
        estado: p.stock_bolsas_cerradas <= 1 ? 'CRÍTICO' : 'REABASTECER'
      })),
      ventasDiarias: ventasDiarias
    };
  }
};