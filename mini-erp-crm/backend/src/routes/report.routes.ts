import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateUser, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.get(
  '/sales',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'),
  ReportController.getSalesSummary
);

router.get(
  '/inventory-forecast',
  authorizeRoles('ADMIN', 'WAREHOUSE', 'ACCOUNTS'),
  ReportController.getInventoryForecast
);

export default router;
