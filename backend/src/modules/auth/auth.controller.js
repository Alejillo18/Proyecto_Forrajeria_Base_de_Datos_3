import { AuthService } from './auth.service.js';

export const AuthController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña requeridos' });
      }

      const data = await AuthService.login({ email, password });
      return res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      res.json({ message: 'Sesión cerrada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async registro(req, res, next) {
    try {
      const { email, password, rol } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña requeridos' });
      }

      const nuevoUsuario = await AuthService.registrar({ email, password, rol });
      res.status(201).json(nuevoUsuario);
    } catch (error) {
      next(error);
    }
  }
};