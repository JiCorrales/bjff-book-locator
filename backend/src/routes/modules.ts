import { Router } from 'express';
import { getModulesItems, patchModuleActive, putModuleRange, patchModule } from '../controllers/modules.controller';

const router = Router();

router.get('/items', getModulesItems);
router.put('/items/:id', putModuleRange);
router.patch('/items/:id', patchModule);
router.patch('/items/:id/active', patchModuleActive);

export default router;