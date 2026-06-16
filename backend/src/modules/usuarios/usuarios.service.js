import { UsuariosDAO } from './usuarios.dao.js';
import bcrypt from 'bcrypt';

export const UsuariosService = {
  async getAll() {
    return await UsuariosDAO.selectAll();
  },

  async getByEmail(email) {
    return await UsuariosDAO.selectByEmail(email);
  },

  async create({ email, password, rol }) {
    const existe = await UsuariosDAO.selectByEmail(email);
    if (existe) {
      const error = new Error('El email ya está registrado');
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return await UsuariosDAO.insert({
      email,
      password: hashedPassword,
      rol
    });
  },

  async update(id, data) {
    const payload = { ...data };
    if (data.password && data.password.trim() !== '') {
      payload.password = await bcrypt.hash(data.password, 10);
    }
    return await UsuariosDAO.update(id, payload);
  }
};