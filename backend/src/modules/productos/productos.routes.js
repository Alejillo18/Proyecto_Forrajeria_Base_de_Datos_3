import { Router } from 'express';
import { ProductosController } from './productos.controller.js';
import { verifyToken, checkRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, ProductosController.getAll);
router.get('/:id', verifyToken, ProductosController.getById);
router.post('/', verifyToken, checkRole(['Administrador']), ProductosController.create);
router.put('/:id', verifyToken, checkRole(['Administrador']), ProductosController.update);
router.delete('/:id', verifyToken, checkRole(['Administrador']), ProductosController.delete);

router.post('/actualizar-precios', verifyToken, checkRole(['Administrador']), ProductosController.updatePricesMassive);
router.post('/ajuste/:id', verifyToken, checkRole(['Administrador']), ProductosController.inventoryAdjustment);

export default router;