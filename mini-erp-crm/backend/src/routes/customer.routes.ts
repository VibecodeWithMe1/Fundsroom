import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateUser, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  CustomerController.create
);

router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'),
  CustomerController.getAll
);

router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'),
  CustomerController.getById
);

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  CustomerController.update
);

router.delete(
  '/:id',
  authorizeRoles('ADMIN'),
  CustomerController.delete
);

router.get(
  '/:id/stage-history',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'),
  CustomerController.getStageHistory
);

router.post(
  '/:customerId/follow-ups',
  authorizeRoles('ADMIN', 'SALES'),
  CustomerController.addFollowUp
);

router.get(
  '/:customerId/follow-ups',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'),
  CustomerController.getFollowUps
);

export default router;
