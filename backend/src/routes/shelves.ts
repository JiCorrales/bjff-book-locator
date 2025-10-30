import { Router } from 'express';
import { getShelvesItems, patchShelfActive, putShelfRange, patchShelf } from '../controllers/shelves.controller';

const router = Router();

router.get('/items', getShelvesItems);
router.put('/items/:id', putShelfRange);
router.patch('/items/:id', patchShelf);
router.patch('/items/:id/active', patchShelfActive);

export default router;