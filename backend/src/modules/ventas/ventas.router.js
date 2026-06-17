import { Router } from 'express';
import { VentasController } from './ventas.controller.js';
import { verifyToken, checkRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.post('/', verifyToken, checkRole(['Administrador', 'Vendedor_Mostrador', 'Distribuidor']), VentasController.crearVenta);
router.get('/pendientes-comision/:id_usuario', verifyToken, checkRole(['Administrador']), VentasController.getPendientesComision);
router.patch('/:id_usuario/liquidar', verifyToken, checkRole(['Administrador']), VentasController.liquidarComisiones);

export default router;