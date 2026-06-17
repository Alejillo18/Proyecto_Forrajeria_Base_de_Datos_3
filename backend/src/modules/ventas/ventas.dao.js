import { prisma } from '../../../config/db.prisma.js';

export const VentasDAO = {
  async insertarVentaTransaccional({ id_usuario, id_cliente, monto_total, metodo_pago, detalles }) {
    return await prisma.$transaction(async (tx) => {
      const nuevaVenta = await tx.venta.create({
        data: {
          id_usuario,
          id_cliente: id_cliente || null,
          monto_total,
          metodo_pago,
        },
        select: {
          id_venta: true,
          fecha: true,
        },
      });

      const deventaData = detalles.map((item) => ({
        id_venta: nuevaVenta.id_venta,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario_historico: item.precio_unitario_historico,
      }));

      await tx.detalleVenta.createMany({
        data: deventaData,
      });

      return {
        id_venta: nuevaVenta.id_venta,
        fecha: nuevaVenta.fecha,
        monto_total,
        metodo_pago,
      };
    });
  },

  async selectPendientesComisionByDistribuidor(id_usuario) {
    return await prisma.venta.findMany({
      where: {
        id_usuario,
        comision_liquidada: false,
        envio: {
          estado: 'Entregado'
        }
      },
      select: {
        id_venta: true,
        fecha: true,
        monto_total: true,
      },
      orderBy: {
        fecha: 'asc'
      }
    });
  },

  async updateComisionesALiquidadas(id_usuario) {
    return await prisma.venta.updateMany({
      where: {
        id_usuario,
        comision_liquidada: false,
        envio: {
          estado: 'Entregado'
        }
      },
      data: {
        comision_liquidada: true
      }
    });
  }
};