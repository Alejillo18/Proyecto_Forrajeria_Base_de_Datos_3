import { Router } from 'express';
import { TurnosController } from './turnos.controller.js';
import { verifyToken, checkRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.get('/activo', verifyToken, TurnosController.getActivo);
router.post('/apertura', verifyToken, TurnosController.abrirTurno);
router.post('/:id/cierre', verifyToken, TurnosController.cerrarTurno);
router.get('/', verifyToken, checkRole(['Administrador']), TurnosController.getAll);

export default router;