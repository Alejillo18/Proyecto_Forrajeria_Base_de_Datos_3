import { AuthDAO } from './auth.dao.js';
import { pool } from '../../../config/db.pg.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redisClient } from '../../../config/db.redis.js';

export const AuthService = {
  async login({ email, password }) {
    const cacheKey = `usuario:email:${email}`;
    let usuario = null;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        usuario = JSON.parse(cachedData);
      }
    } catch (err) {}

    if (!usuario) {
      usuario = await AuthDAO.selectByEmail(email);
      if (usuario) {
        try {
          await redisClient.set(cacheKey, JSON.stringify(usuario), { EX: 3600 });
        } catch (err) {}
      }
    }

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

    const secretKey = process.env.JWT_SECRET || 'clave_secreta_de_emergencia_forrajeria';

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email, rol: usuario.rol },
      secretKey,
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

    const { rows } = await pool.query(
      `INSERT INTO usuarios (id_usuario, email, password, rol, activo) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id_usuario, email, rol, activo`,
      [idGenerado, email, passwordHash, rol || 'Empleado']
    );

    return rows[0];
  }
};