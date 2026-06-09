import { prisma } from '../../../config/db.prisma.js';

export const AuthDAO = {
  async selectByEmail(email) {
    return await prisma.usuario.findFirst({
      where: {
        email,
      },
      select: {
        id_usuario: true,
        email: true,
        password: true,
        rol: true,
        activo: true,
      },
    });
  },
};