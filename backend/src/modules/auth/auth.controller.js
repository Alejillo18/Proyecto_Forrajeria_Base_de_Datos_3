import { AuthService } from './auth.service.js';

export const AuthController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña requeridos' });
      }

      const data = await AuthService.login({ email, password });
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {

      res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      next(error);
    }
  }
};