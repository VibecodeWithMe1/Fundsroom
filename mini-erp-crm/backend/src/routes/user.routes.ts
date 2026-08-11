import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateUser, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);
router.use(authorizeRoles('ADMIN'));

router.post('/', UserController.create);
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);

export default router;
