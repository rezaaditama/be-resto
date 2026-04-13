import { Router } from 'express';
import { 
    createTaxController, 
    getAllTaxesController,
    updateTaxController, 
    deleteTaxController
}from '../services/taxes-service/taxes.controller';

const TaxesRouter = Router();

TaxesRouter.get('/taxes', getAllTaxesController);
TaxesRouter.post('/create-taxes', createTaxController);
TaxesRouter.put('/update-taxes/:id', updateTaxController);
TaxesRouter.delete('/delete-taxes/:id', deleteTaxController);

export default TaxesRouter;