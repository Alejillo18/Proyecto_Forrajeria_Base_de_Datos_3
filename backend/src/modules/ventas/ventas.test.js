import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { VentasService } from './ventas.service.js';
import { VentasDAO } from './ventas.dao.js';
import { ProductosDAO } from '../productos/productos.dao.js';
import { redisClient } from '../../../config/db.redis.js';

describe('Módulo de Ventas - Pruebas de Consistencia Híbrida', () => {

  const fakeInputVenta = {
    id_usuario: '00000000-0000-0000-0000-000000000001',
    id_cliente: '00000000-0000-0000-0000-000000000005',
    monto_total: 44000,
    metodo_pago: 'efectivo',
    detalles: [
      { id_producto: '00000000-0000-0000-0000-000000000100', cantidad: 2, unidad_vendida: 'bolsa', precio_unitario_historico: 22000 }
    ]
  };

  const fakeProductoDB = {
    id_producto: '00000000-0000-0000-0000-000000000100',
    nombre_producto: 'Alimento Bolsa 20kg',
    stock_bolsas_cerradas: 10,
    stock_kilos_granel: 40,
    activo: true
  };

  const fakeVentasComisionables = [
    { id_venta: 'v-01', fecha: new Date('2026-06-08'), monto_total: 50000 },
    { id_venta: 'v-02', fecha: new Date('2026-06-09'), monto_total: 30000 }
  ];

  beforeEach(() => {
    redisClient.keys = () => Promise.resolve([]);
    redisClient.del = () => Promise.resolve(0);
    
    ProductosDAO.selectById = () => Promise.resolve(fakeProductoDB);
    ProductosDAO.update = () => Promise.resolve({ ...fakeProductoDB, stock_bolsas_cerradas: 8 });
    
    VentasDAO.insertarVentaTransaccional = () => Promise.resolve({
      id_venta: '77f1a2b3-c4d5-e6f7-a8b9-c00123456789',
      monto_total: 44000
    });

    VentasDAO.selectPendientesComisionByDistribuidor = () => Promise.resolve([]);
    VentasDAO.updateComisionesALiquidadas = () => Promise.resolve({ count: 0 });
  });

  test('procesarVenta() - Debería ejecutar flujo completo si hay stock disponible', async () => {
    let stockDescontado = false;
    ProductosDAO.update = async (id, data) => {
      assert.strictEqual(id, '00000000-0000-0000-0000-000000000100');
      assert.strictEqual(data.stock_bolsas_cerradas, 8);
      stockDescontado = true;
      return { ...fakeProductoDB, stock_bolsas_cerradas: 8 };
    };
    const resultado = await VentasService.procesarVenta(fakeInputVenta);
    assert.strictEqual(resultado.monto_total, 44000);
    assert.strictEqual(stockDescontado, true);
  });

  test('procesarVenta() - Debería arrojar error 400 si el producto no tiene suficiente stock', async () => {
    ProductosDAO.selectById = () => Promise.resolve({
      ...fakeProductoDB,
      stock_bolsas_cerradas: 1
    });

    await assert.rejects(
      async () => {
        await VentasService.procesarVenta(fakeInputVenta);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /Stock insuficiente/);
        return true;
      }
    );
  });

  test('obtenerComisionesPendientes() - Debería calcular el acumulado del 10% sobre las entregas del distribuidor', async () => {
    VentasDAO.selectPendientesComisionByDistribuidor = async (id_usuario) => {
      assert.strictEqual(id_usuario, 'dist-123');
      return fakeVentasComisionables;
    };

    const resultado = await VentasService.obtenerComisionesPendientes('dist-123');

    assert.strictEqual(resultado.id_usuario, 'dist-123');
    assert.strictEqual(resultado.cantidad_entregas_pendientes, 2);
    assert.strictEqual(resultado.total_venta_acumulado, 80000);
    assert.strictEqual(resultado.comision_porcentaje, 10);
    assert.strictEqual(resultado.total_comision_a_pagar, 8000);
    assert.strictEqual(resultado.ventas[0].id_venta, 'v-01');
  });

  test('liquidarComisionesDistribuidor() - Debería cambiar el estado en lote e indicar los IDs procesados', async () => {
    VentasDAO.selectPendientesComisionByDistribuidor = async () => fakeVentasComisionables;
    
    let daoUpdateLlamado = false;
    VentasDAO.updateComisionesALiquidadas = async (id_usuario) => {
      assert.strictEqual(id_usuario, 'dist-123');
      daoUpdateLlamado = true;
      return { count: 2 };
    };

    const resultado = await VentasService.liquidarComisionesDistribuidor('dist-123');

    assert.strictEqual(daoUpdateLlamado, true);
    assert.strictEqual(resultado.monto_paid || resultado.monto_pagado, 8000);
    assert.deepStrictEqual(resultado.tickets_liquidados, ['v-01', 'v-02']);
  });

  test('liquidarComisionesDistribuidor() - Debería arrojar error 400 si el distribuidor no registra deudas', async () => {
    VentasDAO.selectPendientesComisionByDistribuidor = async () => [];

    await assert.rejects(
      async () => {
        await VentasService.liquidarComisionesDistribuidor('dist-999');
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.message, 'El distribuidor no registra comisiones pendientes de liquidar');
        return true;
      }
    );
  });
});