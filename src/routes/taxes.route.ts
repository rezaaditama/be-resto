import { Router } from 'express';
import { 
    createTaxController, 
    updateTaxController, 
    deleteTaxController
}from '../services/taxes-service/taxes.controller';

const TaxesRouter = Router();

TaxesRouter.post('/create-taxes', createTaxController);
TaxesRouter.put('/update-taxes/:id', updateTaxController);
TaxesRouter.delete('/delete-taxes/:id', deleteTaxController);

export default TaxesRouter;