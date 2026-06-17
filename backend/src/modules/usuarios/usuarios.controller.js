import { UsuariosDAO } from './usuarios.dao.js';
import bcrypt from 'bcrypt';

export const UsuariosController = {
  async getAll(req, res, next) {
    try {
      const usuarios = await UsuariosDAO.selectAll();
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { email, password, rol } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña requeridos' });
      }

      const existe = await UsuariosDAO.selectByEmail(email);
      if (existe) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const nuevoUsuario = await UsuariosDAO.insert({
        email,
        password: hashedPassword,
        rol
      });

      res.status(201).json({
        id_usuario: nuevoUsuario.id_usuario,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { password, ...restoDatos } = req.body;

      const payload = { ...restoDatos };
      if (password && password.trim() !== '') {
        payload.password = await bcrypt.hash(password, 10);
      }

      const usuarioActualizado = await UsuariosDAO.update(id, payload);
      res.json(usuarioActualizado);
    } catch (error) {
      next(error);
    }
  }
};