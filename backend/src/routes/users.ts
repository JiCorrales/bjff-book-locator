import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from '../controllers/userController';
import { authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authorize(['admin', 'isMaster']), listUsers);
router.post('/', authorize(['admin', 'isMaster']), createUser);
router.get('/:id', authorize(['admin', 'isMaster']), getUser);
router.put('/:id', authorize(['admin', 'isMaster']), updateUser);
router.delete('/:id', authorize(['admin', 'isMaster']), deleteUser);

export default router;
