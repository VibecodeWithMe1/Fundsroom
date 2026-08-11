import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticateUser, AuthController.me);
router.post('/logout', authenticateUser, AuthController.logout);

export default router;
