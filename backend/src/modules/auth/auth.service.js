import { AuthDAO } from './auth.dao.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
  }
};