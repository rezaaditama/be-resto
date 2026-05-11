import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { createOrderController } from "../services/order-service/order.controller";

const OrderRouter = Router();

OrderRouter.post("/create-order", authenticateToken, authorizeRole(["CASHIER", "WAITER", "KIOSK_SYSTEM", "CUSTOMER", "GUEST"]), createOrderController);

export default OrderRouter;