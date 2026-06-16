import { Router } from 'express';
import { UsuariosController } from './usuarios.controller.js';
import { verifyToken, checkRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, checkRole(['Administrador']), UsuariosController.getAll);
router.post('/', verifyToken, checkRole(['Administrador']), UsuariosController.create);
router.put('/:id', verifyToken, checkRole(['Administrador']), UsuariosController.update);

export default router;