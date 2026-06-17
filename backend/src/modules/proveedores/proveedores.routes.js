import { Router } from 'express';
import { ProveedoresController } from './proveedores.controller.js';
import { verifyToken, checkRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, ProveedoresController.getAll);
router.get('/:id', verifyToken, ProveedoresController.getById);
router.post('/', verifyToken, checkRole(['Administrador']), ProveedoresController.create);
router.put('/:id', verifyToken, checkRole(['Administrador']), ProveedoresController.update);
router.delete('/:id', verifyToken, checkRole(['Administrador']), ProveedoresController.delete);

export default router;