import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { VentasService } from './ventas.service.js';
import { VentasDAO } from './ventas.dao.js';
import { ProductosDAO } from '../productos/productos.dao.js';

const fakeProducto = {
  id_producto: 'prod-100',
  nombre_producto: 'Alimento Bolsa 20kg',
  stock_bolsas_cerradas: 10,
  stock_kilos_granel: 40,
  activo: true
};

const fakeInputVenta = {
  id_usuario: 'usr-001',
  id_cliente: 'cli-005',
  monto_total: 44000,
  metodo_pago: 'efectivo',
  detalles: [{ id_producto: 'prod-100', cantidad: 2, unidad_vendida: 'bolsa', precio_unitario_historico: 22000 }]
};

const fakeVentasComisionables = [
  { id_venta: 'v-01', fecha: new Date(), monto_total: 50000 },
  { id_venta: 'v-02', fecha: new Date(), monto_total: 30000 }
];

describe('Módulo Ventas — Procesamiento y Comisiones', () => {

  beforeEach(() => {
    ProductosDAO.selectById              = () => Promise.resolve(fakeProducto);
    ProductosDAO.update                  = () => Promise.resolve({});
    VentasDAO.insertarVentaTransaccional = () => Promise.resolve({ id_venta: 'nueva-venta', monto_total: 44000 });
    VentasDAO.selectPendientesComisionByDistribuidor = () => Promise.resolve([]);
    VentasDAO.updateComisionesALiquidadas            = () => Promise.resolve({ count: 0 });
  });

  test('procesarVenta() — Flujo completo: verifica stock, inserta y descuenta bolsas', async () => {
    let stockDescontado = false;
    ProductosDAO.update = async (id, data) => {
      assert.strictEqual(data.stock_bolsas_cerradas, 8);
      stockDescontado = true;
      return {};
    };
    const r = await VentasService.procesarVenta(fakeInputVenta);
    assert.strictEqual(r.monto_total, 44000);
    assert.strictEqual(stockDescontado, true);
  });

  test('procesarVenta() — Descuenta stock_kilos_granel si unidad_vendida es kilo', async () => {
    let stockDescontado = false;
    ProductosDAO.update = async (id, data) => {
      assert.strictEqual(data.stock_kilos_granel, 35);
      stockDescontado = true;
      return {};
    };
    const ventaKilos = {
      ...fakeInputVenta,
      detalles: [{ id_producto: 'prod-100', cantidad: 5, unidad_vendida: 'kilo', precio_unitario_historico: 1500 }]
    };
    await VentasService.procesarVenta(ventaKilos);
    assert.strictEqual(stockDescontado, true);
  });

  test('procesarVenta() — Lanza 400 si no hay suficiente stock de bolsas', async () => {
    ProductosDAO.selectById = () => Promise.resolve({ ...fakeProducto, stock_bolsas_cerradas: 1 });
    await assert.rejects(
      () => VentasService.procesarVenta(fakeInputVenta),
      (err) => { assert.strictEqual(err.status, 400); assert.match(err.message, /Stock insuficiente/); return true; }
    );
  });

  test('procesarVenta() — Lanza 400 si el producto no existe', async () => {
    ProductosDAO.selectById = () => Promise.resolve(null);
    await assert.rejects(
      () => VentasService.procesarVenta(fakeInputVenta),
      (err) => { assert.strictEqual(err.status, 400); assert.match(err.message, /Producto no encontrado/); return true; }
    );
  });

  test('procesarVenta() — Lanza 400 si la unidad de medida no es válida', async () => {
    const ventaInvalida = {
      ...fakeInputVenta,
      detalles: [{ id_producto: 'prod-100', cantidad: 1, unidad_vendida: 'tonelada', precio_unitario_historico: 5000 }]
    };
    await assert.rejects(
      () => VentasService.procesarVenta(ventaInvalida),
      (err) => { assert.strictEqual(err.status, 400); assert.match(err.message, /Unidad de medida no válida/); return true; }
    );
  });

  test('obtenerComisionesPendientes() — Calcula el 10% sobre el acumulado de ventas', async () => {
    VentasDAO.selectPendientesComisionByDistribuidor = async () => fakeVentasComisionables;
    const r = await VentasService.obtenerComisionesPendientes('dist-123');
    assert.strictEqual(r.cantidad_entregas_pendientes, 2);
    assert.strictEqual(r.total_venta_acumulado, 80000);
    assert.strictEqual(r.comision_porcentaje, 10);
    assert.strictEqual(r.total_comision_a_pagar, 8000);
  });

  test('obtenerComisionesPendientes() — Retorna ceros si no hay entregas pendientes', async () => {
    VentasDAO.selectPendientesComisionByDistribuidor = async () => [];
    const r = await VentasService.obtenerComisionesPendientes('dist-sin-ventas');
    assert.strictEqual(r.cantidad_entregas_pendientes, 0);
    assert.strictEqual(r.total_comision_a_pagar, 0);
  });

  test('liquidarComisionesDistribuidor() — Llama al DAO, retorna monto_pagado y tickets_liquidados', async () => {
    VentasDAO.selectPendientesComisionByDistribuidor = async () => fakeVentasComisionables;
    VentasDAO.updateComisionesALiquidadas = async () => ({ count: 2 });
    const r = await VentasService.liquidarComisionesDistribuidor('dist-123');
    assert.strictEqual(r.monto_pagado, 8000);
    assert.deepStrictEqual(r.tickets_liquidados, ['v-01', 'v-02']);
    assert.ok(r.mensaje);
  });

  test('liquidarComisionesDistribuidor() — Lanza 400 si no hay comisiones pendientes', async () => {
    VentasDAO.selectPendientesComisionByDistribuidor = async () => [];
    await assert.rejects(
      () => VentasService.liquidarComisionesDistribuidor('dist-999'),
      (err) => { assert.strictEqual(err.status, 400); return true; }
    );
  });
});
