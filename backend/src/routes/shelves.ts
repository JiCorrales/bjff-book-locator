import { Router } from 'express';
import { getShelvesItems } from '../controllers/shelves.controller';

const router = Router();

router.get('/items', getShelvesItems);

export default router;