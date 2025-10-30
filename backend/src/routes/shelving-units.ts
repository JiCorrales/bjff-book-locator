import { Router } from 'express';
import { getShelvingUnitsItems } from '../controllers/shelvingUnits.controller';

const router = Router();

router.get('/items', getShelvingUnitsItems);

export default router;