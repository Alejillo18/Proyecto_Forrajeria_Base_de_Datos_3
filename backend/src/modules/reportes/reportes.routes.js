import { Router } from 'express';
import { ReportesController } from './reportes.controller.js';
import { verifyToken, checkRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.get('/dashboard', verifyToken, checkRole(['Administrador']), ReportesController.getDashboard);

export default router;