import { Router } from 'express';
import { getModulesItems } from '../controllers/modules.controller';

const router = Router();

router.get('/items', getModulesItems);

export default router;