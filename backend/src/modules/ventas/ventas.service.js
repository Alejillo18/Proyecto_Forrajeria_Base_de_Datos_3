import { VentasDAO } from './ventas.dao.js';
import { ProductosDAO } from '../productos/productos.dao.js';

export const VentasService = {
  async procesarVenta({ id_usuario, id_cliente, monto_total, metodo_pago, detalles }) {
    for (const item of detalles) {
      const producto = await ProductosDAO.selectById(item.id_producto);
      if (!producto) {
        const error = new Error(`Producto no encontrado: ${item.id_producto}`);
        error.status = 400;
        throw error;
      }

      if (item.unidad_vendida === 'bolsa') {
        if (producto.stock_bolsas_cerradas < item.cantidad) {
          const error = new Error(`Stock insuficiente de bolsas cerradas para: ${producto.nombre_producto}`);
          error.status = 400;
          throw error;
        }
      } else if (item.unidad_vendida === 'kilo') {
        if (producto.stock_kilos_granel < item.cantidad) {
          const error = new Error(`Stock insuficiente de kilos a granel para: ${producto.nombre_producto}`);
          error.status = 400;
          throw error;
        }
      } else {
        const error = new Error(`Unidad de medida no válida: ${item.unidad_vendida}`);
        error.status = 400;
        throw error;
      }
    }

    const venta = await VentasDAO.insertarVentaTransaccional({
      id_usuario,
      id_cliente,
      monto_total,
      metodo_pago,
      detalles,
    });

    for (const item of detalles) {
      const producto = await ProductosDAO.selectById(item.id_producto);
      
      const cambiosStock = {};
      if (item.unidad_vendida === 'bolsa') {
        cambiosStock.stock_bolsas_cerradas = producto.stock_bolsas_cerradas - item.cantidad;
      } else {
        cambiosStock.stock_kilos_granel = producto.stock_kilos_granel - item.cantidad;
      }

      await ProductosDAO.update(item.id_producto, cambiosStock);
    }

    return venta;
  },

  async obtenerComisionesPendientes(id_usuario) {
    const ventasPendientes = await VentasDAO.selectPendientesComisionByDistribuidor(id_usuario);
    
    const PORCENTAJE_COMISION = 0.10; 
    
    const total_ventas = ventasPendientes.reduce((acc, v) => acc + Number(v.monto_total), 0);
    const total_comision = total_ventas * PORCENTAJE_COMISION;

    return {
      id_usuario,
      cantidad_entregas_pendientes: ventasPendientes.length,
      total_venta_acumulado: total_ventas,
      comision_porcentaje: PORCENTAJE_COMISION * 100,
      total_comision_a_pagar: Math.round(total_comision * 100) / 100,
      ventas: ventasPendientes
    };
  },

  async liquidarComisionesDistribuidor(id_usuario) {
    const liquidacionActual = await this.obtenerComisionesPendientes(id_usuario);
    if (liquidacionActual.cantidad_entregas_pendientes === 0) {
      const error = new Error('El distribuidor no registra comisiones pendientes de liquidar');
      error.status = 400;
      throw error;
    }

    await VentasDAO.updateComisionesALiquidadas(id_usuario);

    return {
      id_usuario,
      mensaje: 'Liquidación procesada correctamente',
      monto_pagado: liquidacionActual.total_comision_a_pagar,
      tickets_liquidados: liquidacionActual.ventas.map(v => v.id_venta)
    };
  }
};