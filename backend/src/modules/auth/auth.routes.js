import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { verifyToken } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/logout', verifyToken, AuthController.logout);
router.post('/registro', AuthController.registro);

export default router;