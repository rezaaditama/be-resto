import { Router } from 'express';
import { 
    createDiscountController, 
    getAllDiscountsController,
    updateDiscountController, 
    deleteDiscountController
} from '../services/discount-service/discount.controller';

const DiscountRouter = Router();

DiscountRouter.get('/discounts', getAllDiscountsController);
DiscountRouter.post('/create-discounts', createDiscountController);
DiscountRouter.put('/update-discounts/:id', updateDiscountController);
DiscountRouter.delete('/delete-discounts/:id', deleteDiscountController);

export default DiscountRouter;