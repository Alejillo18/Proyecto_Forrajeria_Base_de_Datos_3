import { Router } from 'express';
import { ClientesController } from './clientes.controller.js';
import { verifyToken, checkRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, ClientesController.getAll);
router.get('/:id', verifyToken, ClientesController.getById);
router.get('/:id/cuenta-corriente', verifyToken, checkRole(['Administrador', 'Vendedor_Mostrador']), ClientesController.getCuentaCorriente);

router.post('/', verifyToken, checkRole(['Administrador', 'Vendedor_Mostrador']), ClientesController.create);
router.put('/:id', verifyToken, checkRole(['Administrador']), ClientesController.update);
router.delete('/:id', verifyToken, checkRole(['Administrador']), ClientesController.delete);

export default router;  