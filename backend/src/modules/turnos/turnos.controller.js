import { TurnosService } from './turnos.service.js';

export const TurnosController = {
  async verificarActivo(req, res, next) {
    try {
      const id_usuario = req.query.id_usuario;
      if (!id_usuario) return res.status(400).json({ message: 'Falta id_usuario' });

      const turno = await TurnosService.getActivo(id_usuario);
      res.json({ activo: !!turno, turno });
    } catch (error) {
      next(error);
    }
  },

  async abrir(req, res, next) {
    try {
      const { id_usuario, monto_inicial } = req.body;
      if (!id_usuario || monto_inicial === undefined) {
        return res.status(400).json({ message: 'Datos de apertura incompletos' });
      }

      const nuevoTurno = await TurnosService.abrirTurno({ id_usuario, monto_inicial });
      res.status(201).json(nuevoTurno);
    } catch (error) {
      next(error);
    }
  },

  async cerrar(req, res, next) {
    try {
      const { id } = req.params;
      const { monto_final_real, auditoria_detalles } = req.body;

      if (monto_final_real === undefined) {
        return res.status(400).json({ message: 'Falta especificar el monto final real contado' });
      }

      const turnoCerrado = await TurnosService.cerrarTurno(id, { monto_final_real, auditoria_detalles });
      res.json({ message: 'Turno cerrado y arqueado con éxito', turno: turnoCerrado });
    } catch (error) {
      next(error);
    }
  },

  async listarTodos(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const data = await TurnosService.getAll({ page, limit });
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
};