import { AuthService } from './auth.service.js';

export const AuthController = {
  async login(req, res) {
    const { email, password } = req.body;
    try {
      const resultado = await AuthService.login({ email, password });
      return res.json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },

  async registro(req, res) {
    const { email, password, rol } = req.body;
    try {
      const nuevoUsuario = await AuthService.registrar({ email, password, rol });
      return res.status(201).json(nuevoUsuario);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },

  async logout(req, res) {
    return res.json({ message: 'Sesión cerrada correctamente.' });
  }
};