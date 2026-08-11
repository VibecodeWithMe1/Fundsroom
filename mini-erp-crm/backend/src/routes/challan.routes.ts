import { Router } from 'express';
import { ChallanController } from '../controllers/challan.controller';
import { authenticateUser, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  ChallanController.create
);

router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  ChallanController.getAll
);

router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  ChallanController.getById
);

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  ChallanController.update
);

router.post(
  '/:id/confirm',
  authorizeRoles('ADMIN', 'SALES'),
  ChallanController.confirm
);

router.post(
  '/:id/cancel',
  authorizeRoles('ADMIN'),
  ChallanController.cancel
);

export default router;
