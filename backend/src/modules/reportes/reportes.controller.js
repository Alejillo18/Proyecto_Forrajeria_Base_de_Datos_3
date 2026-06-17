import { ReportesService } from './reportes.service.js';

export const ReportesController = {
  async getDashboard(req, res, next) {
    try {
      const dashboardData = await ReportesService.obtenerDashboardCompleto();
      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  }
};