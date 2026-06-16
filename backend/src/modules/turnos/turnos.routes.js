import { Router } from 'express';
import { TurnosController } from './turnos.controller.js';
import { verifyToken, checkRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.get('/activo', verifyToken, TurnosController.verificarActivo);
router.post('/apertura', verifyToken, TurnosController.abrir);
router.post('/:id/cierre', verifyToken, TurnosController.cerrar);
router.get('/', verifyToken, checkRole(['Administrador']), TurnosController.listarTodos);

export default router;