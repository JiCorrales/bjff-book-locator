import { Router } from 'express';
import { getShelvingUnitsItems, patchShelvingUnitActive, putShelvingUnitRange, patchShelvingUnit } from '../controllers/shelvingUnits.controller';

const router = Router();

router.get('/items', getShelvingUnitsItems);
router.put('/items/:id', putShelvingUnitRange);
router.patch('/items/:id', patchShelvingUnit);
router.patch('/items/:id/active', patchShelvingUnitActive);

export default router;