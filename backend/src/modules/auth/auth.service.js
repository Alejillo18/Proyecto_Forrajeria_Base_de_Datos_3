import { AuthDAO } from './auth.dao.js';
import { pool } from '../../../config/db.pg.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const AuthService = {
  async login({ email, password }) {
    const usuario = await AuthDAO.selectByEmail(email);
    if (!usuario || !usuario.activo) {
      const error = new Error('Credenciales incorrectas o usuario inactivo');
      error.status = 401;
      throw error;
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      const error = new Error('Credenciales incorrectas');
      error.status = 401;
      throw error;
    }

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || 'tu_clave_secreta_aqui',
      { expiresIn: '8h' }
    );

    return {
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        rol: usuario.rol
      }
    };
  },

  async registrar({ email, password, rol }) {
    const usuarioExistente = await AuthDAO.selectByEmail(email);
    if (usuarioExistente) {
      const error = new Error('El correo electrónico ya está registrado');
      error.status = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const idGenerado = crypto.randomUUID();

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        id_usuario: idGenerado,
        email,
        password: passwordHash,
        rol: rol || 'Empleado',
        activo: true
      }
    });

    return {
      id_usuario: nuevoUsuario.id_usuario,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
      activo: nuevoUsuario.activo
    };
  }
};