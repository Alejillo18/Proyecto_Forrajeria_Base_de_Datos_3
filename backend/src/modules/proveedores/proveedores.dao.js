import { prisma } from '../../../config/db.prisma.js';

export const ProveedoresDAO = {
  async selectAll({ limit, offset }) {
    return await prisma.proveedor.findMany({
      where: {
        activo: true,
      },
      select: {
        id_proveedor: true,
        cuit: true,
        nombre_empresa: true,
        contacto_nombre: true,
        telefono: true,
      },
      orderBy: {
        id_proveedor: 'desc',
      },
      take: limit,
      skip: offset,
    });
  },

  async selectById(id) {
    return await prisma.proveedor.findFirst({
      where: {
        id_proveedor: id,
        activo: true,
      },
    });
  },

  async insert({ cuit, nombre_empresa, contacto_nombre, telefono }) {
    return await prisma.proveedor.create({
      data: {
        cuit,
        nombre_empresa,
        contacto_nombre: contacto_nombre || null,
        telefono: telefono || null,
      },
    });
  },

  async update(id, { cuit, nombre_empresa, contacto_nombre, telefono }) {
    return await prisma.proveedor.update({
      where: {
        id_proveedor: id,
      },
      data: {
        cuit,
        nombre_empresa,
        contacto_nombre,
        telefono,
      },
    });
  },

  async deleteSoft(id) {
    return await prisma.proveedor.update({
      where: {
        id_proveedor: id,
      },
      data: {
        activo: false,
      },
      select: {
        id_proveedor: true,
        nombre_empresa: true,
        activo: true,
      },
    });
  },
};