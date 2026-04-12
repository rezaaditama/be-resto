import { Router } from 'express';
import { 
    createTaxController, 
    updateTaxController, 
    deleteTaxController
}from '../services/taxes-service/taxes.controller';

const router = Router();
router.post('/', createTaxController);
router.put('/:id', updateTaxController);
router.delete('/:id', deleteTaxController);

export default router;