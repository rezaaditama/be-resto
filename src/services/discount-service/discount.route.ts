import { Router } from 'express';
import { 
    createDiscountController, 
    getAllDiscountsController,
    updateDiscountController, 
    deleteDiscountController
} from './discount.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { authorizeRole } from '../../middlewares/role.middleware';

const DiscountRouter = Router();

DiscountRouter.get('/', authenticateToken, authorizeRole(["CASHIER", "WAITER", "KIOSK_SYSTEM", "CUSTOMER", "GUEST"]), getAllDiscountsController);
DiscountRouter.post('/create-discounts', authenticateToken, authorizeRole(["CASHIER"]), createDiscountController);
DiscountRouter.put('/update-discounts/:id', authenticateToken, authorizeRole(["CASHIER"]), updateDiscountController);
DiscountRouter.delete('/delete-discounts/:id', authenticateToken, authorizeRole(["CASHIER"]), deleteDiscountController);

export default DiscountRouter;