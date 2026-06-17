import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ReportesService } from './reportes.service.js';
import { ReportesDAO } from './reportes.dao.js';
import { Producto } from '../productos/productos.model.js';

const fakeMetricas = {
  facturacion_hoy: 150000, cantidad_ventas_hoy: 5,
  facturacion_mes: 1200000,
  metodos_pago: [{ metodo: 'Efectivo', total: 150000, cantidad: 5 }]
};
const fakeTopVendedores   = [{ id_vendedor: 'v1', nombre: 'Carlos', total_vendido: 150000 }];
const fakeDeudores        = [{ id_cliente: 'c1', nombre_cliente: 'Juan Fiado', saldo_deudor: 75000 }];
const fakeComisiones      = [{ id_usuario: 'r1', comision_pendiente: 9000, total_distribuido: 90000 }];
const fakeProductosCrit   = [{ _id: 'p1', sku: 'ALIM-01', nombre_producto: 'Alimento 20kg', stock_bolsas_cerradas: 1, stock_kilos_granel: 0 }];
const fakeProductosReab   = [{ _id: 'p2', sku: 'ALIM-02', nombre_producto: 'Alimento Gato', stock_bolsas_cerradas: 3, stock_kilos_granel: 5 }];

describe('Módulo Reportes — Dashboard Completo', () => {

  beforeEach(() => {
    ReportesDAO.obtenerMetricasFinancieras             = () => Promise.resolve(fakeMetricas);
    ReportesDAO.obtenerTopVendedores                   = () => Promise.resolve(fakeTopVendedores);
    ReportesDAO.obtenerDeudoresCriticos                = () => Promise.resolve(fakeDeudores);
    ReportesDAO.obtenerComisionesDistribuidoresResumen = () => Promise.resolve(fakeComisiones);
    Producto.find = () => ({ select: () => Promise.resolve(fakeProductosCrit) });
  });

  test('obtenerDashboardCompleto() — Consolida financiero, vendedores, deudores, repartidores y stock', async () => {
    const r = await ReportesService.obtenerDashboardCompleto();
    assert.strictEqual(r.financiero.facturacion_hoy, 150000);
    assert.strictEqual(r.ranking_vendedores[0].nombre, 'Carlos');
    assert.strictEqual(r.riesgo_credito.deudores[0].nombre_cliente, 'Juan Fiado');
    assert.strictEqual(r.logistica_distribucion.resumen_repartidores[0].comision_pendiente, 9000);
    assert.strictEqual(r.alertas_stock[0].estado, 'CRÍTICO');
  });

  test('obtenerDashboardCompleto() — Alerta de stock en estado REABASTECER si bolsas > 1', async () => {
    Producto.find = () => ({ select: () => Promise.resolve(fakeProductosReab) });
    const r = await ReportesService.obtenerDashboardCompleto();
    assert.strictEqual(r.alertas_stock[0].estado, 'REABASTECER');
  });

  test('obtenerDashboardCompleto() — Cada alerta incluye sku, nombre, bolsas y kilos_granel', async () => {
    const r = await ReportesService.obtenerDashboardCompleto();
    const alerta = r.alertas_stock[0];
    assert.ok(alerta.sku);
    assert.ok(alerta.nombre);
    assert.strictEqual(typeof alerta.bolsas, 'number');
    assert.strictEqual(typeof alerta.kilos_granel, 'number');
  });

  test('obtenerDashboardCompleto() — alertas_stock vacío si no hay productos críticos', async () => {
    Producto.find = () => ({ select: () => Promise.resolve([]) });
    const r = await ReportesService.obtenerDashboardCompleto();
    assert.strictEqual(r.alertas_stock.length, 0);
  });

  test('obtenerDashboardCompleto() — riesgo_credito y logistica_distribucion tienen descripcion', async () => {
    const r = await ReportesService.obtenerDashboardCompleto();
    assert.ok(r.riesgo_credito.descripcion);
    assert.ok(r.logistica_distribucion.descripcion);
  });

  test('obtenerDashboardCompleto() — deudores vacío si no hay clientes en deuda', async () => {
    ReportesDAO.obtenerDeudoresCriticos = () => Promise.resolve([]);
    const r = await ReportesService.obtenerDashboardCompleto();
    assert.strictEqual(r.riesgo_credito.deudores.length, 0);
  });

  test('obtenerDashboardCompleto() — Propaga el error si falla un DAO', async () => {
    ReportesDAO.obtenerMetricasFinancieras = () => Promise.reject(new Error('Error de DB'));
    await assert.rejects(
      () => ReportesService.obtenerDashboardCompleto(),
      (err) => { assert.match(err.message, /Error de DB/); return true; }
    );
  });
});
