import { prisma } from '../../../config/db.prisma.js';

export const ClientesDAO = {
  async selectAll({ limit, offset }) {
    return await prisma.cliente.findMany({
      where: {
        activo: true,
      },
      select: {
        id_cliente: true,
        nombre_cliente: true,
        dni_cuit: true,
        telefono: true,
        direccion: true,
        email: true,
        id_membresia: true,
        fecha_creacion: true,
      },
      orderBy: [
        { fecha_creacion: 'desc' },
        { id_cliente: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  },

  async selectById(id) {
    return await prisma.cliente.findFirst({
      where: {
        id_cliente: id,
        activo: true,
      },
    });
  },

  async insert({ nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia }) {
    return await prisma.cliente.create({
      data: {
        nombre_cliente,
        dni_cuit,
        telefono: telefono || null,
        direccion: direccion || null,
        email: email || null,
        id_membresia: id_membresia || null,
      },
    });
  },

  async update(id, { nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia }) {
    return await prisma.cliente.update({
      where: {
        id_cliente: id,
      },
      data: {
        nombre_cliente,
        dni_cuit,
        telefono: telefono || null,
        direccion: direccion || null,
        email: email || null,
        id_membresia: id_membresia || null,
      },
    });
  },

  async deleteSoft(id) {
    return await prisma.cliente.update({
      where: {
        id_cliente: id,
      },
      data: {
        activo: false,
      },
      select: {
        id_cliente: true,
        nombre_cliente: true,
        activo: true,
      },
    });
  },

  // --- Métodos Nuevos para Cuenta Corriente (HU-13) ---

  async obtenerSaldoDeudor(id_cliente) {
    const agregacion = await prisma.venta.aggregate({
      _sum: {
        total: true
      },
      where: {
        id_cliente,
        metodo_pago: 'Cuenta Corriente'
      }
    });
    return Number(agregacion._sum.total || 0);
  },

  async selectHistorialCuentaCorriente(id_cliente) {
    return await prisma.venta.findMany({
      where: {
        id_cliente,
        metodo_pago: 'Cuenta Corriente'
      },
      select: {
        id_venta: true,
        fecha: true,
        total: true,
        metodo_pago: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });
  }
};