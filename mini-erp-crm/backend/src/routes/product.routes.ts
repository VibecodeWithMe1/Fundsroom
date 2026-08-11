import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateUser, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.post(
  '/',
  authorizeRoles('ADMIN'),
  ProductController.create
);

router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  ProductController.getAll
);

router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  ProductController.getById
);

router.put(
  '/:id',
  authorizeRoles('ADMIN'),
  ProductController.update
);

router.post(
  '/:id/adjust',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  ProductController.adjustStock
);

export default router;
