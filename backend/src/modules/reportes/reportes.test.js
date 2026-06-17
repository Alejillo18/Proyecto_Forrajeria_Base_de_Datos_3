import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ReportesService } from './reportes.service.js';
import { ReportesDAO } from './reportes.dao.js';
import { Producto } from '../productos/productos.model.js';

describe('Módulo de Reportes - Pruebas del Dashboard', () => {

  const fakeMetricas = {
    facturacion_hoy: 150000,
    cantidad_ventas_hoy: 5,
    facturacion_mes: 1200000,
    metodos_pago: [{ metodo: 'Efectivo', total: 150000, cantidad: 5 }]
  };

  const fakeTopVendedores = [
    { id_vendedor: 'v1', nombre: 'Carlos Vendedor', total_vendido: 150000, cantidad_ventas: 5 }
  ];

  const fakeDeudoresCriticos = [
    { id_cliente: 'c-100', nombre_cliente: 'Juan Fiado', telefono: '3548999999', saldo_deudor: 75000 }
  ];

  const fakeComisionesDistribuidores = [
    { id_usuario: 'repartidor-01', entregas_pendientes_pago: 3, total_distribuido: 90000, comision_pendiente: 9000 }
  ];

  const fakeProductosCriticos = [
    { _id: 'p1', sku: 'ALIM-01', nombre_producto: 'Alimento Perro 20kg', stock_bolsas_cerradas: 1, stock_kilos_granel: 0 }
  ];

  beforeEach(() => {
    ReportesDAO.obtenerMetricasFinancieras = () => Promise.resolve(fakeMetricas);
    ReportesDAO.obtenerTopVendedores = () => Promise.resolve(fakeTopVendedores);
    ReportesDAO.obtenerDeudoresCriticos = () => Promise.resolve(fakeDeudoresCriticos);
    ReportesDAO.obtenerComisionesDistribuidoresResumen = () => Promise.resolve(fakeComisionesDistribuidores);
    
    Producto.find = () => ({
      select: () => Promise.resolve(fakeProductosCriticos)
    });
  });

  test('obtenerDashboardCompleto() - Debería consolidar métricas financieras, alertas de stock, deudores y comisiones', async () => {
    const resultado = await ReportesService.obtenerDashboardCompleto();


    assert.strictEqual(resultado.financiero.facturacion_hoy, 150000);
    assert.strictEqual(resultado.ranking_vendedores[0].nombre, 'Carlos Vendedor');
    

    assert.strictEqual(resultado.riesgo_credito.deudores.length, 1);
    assert.strictEqual(resultado.riesgo_credito.deudores[0].nombre_cliente, 'Juan Fiado');
    assert.strictEqual(resultado.riesgo_credito.deudores[0].saldo_deudor, 75000);
    
    assert.strictEqual(resultado.logistica_distribucion.resumen_repartidores.length, 1);
    assert.strictEqual(resultado.logistica_distribucion.resumen_repartidores[0].comision_pendiente, 9000);

    assert.strictEqual(resultado.alertas_stock.length, 1);
    assert.strictEqual(resultado.alertas_stock[0].estado, 'CRÍTICO');
  });

  test('obtenerDashboardCompleto() - Debería manejar correctamente el estado de REABASTECER', async () => {
    Producto.find = () => ({
      select: () => Promise.resolve([
        { _id: 'p2', sku: 'ALIM-02', nombre_producto: 'Alimento Gato', stock_bolsas_cerradas: 3, stock_kilos_granel: 5 }
      ])
    });

    const resultado = await ReportesService.obtenerDashboardCompleto();
    assert.strictEqual(resultado.alertas_stock[0].estado, 'REABASTECER');
  });
});