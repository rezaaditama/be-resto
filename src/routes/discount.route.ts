import { Router } from 'express';
import { 
  createDiscountController, 
  getAllDiscountsController, 
  updateDiscountController, 
  deleteDiscountController 
} from '../services/discount-service/discount.controller';

const router = Router();

router.post('/', createDiscountController);
router.get('/', getAllDiscountsController);
router.put('/:id', updateDiscountController);
router.delete('/:id', deleteDiscountController);

export default router;