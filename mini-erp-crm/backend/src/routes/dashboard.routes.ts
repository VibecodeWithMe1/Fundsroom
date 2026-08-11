import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticateUser, DashboardController.getSummary);
router.get('/alerts', authenticateUser, DashboardController.getAlerts);

export default router;
