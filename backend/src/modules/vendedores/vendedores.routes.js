import { Router } from 'express';
import { VendedoresController } from './vendedores.controller.js';

const router = Router();
router.get('/', VendedoresController.getAll);
router.post('/', VendedoresController.create);
router.put('/:id', VendedoresController.update);

export default router;