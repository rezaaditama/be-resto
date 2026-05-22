import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { createOrderController, getMyAllOrderController, getMyOrderByIdController, getOrderByIdController, getOrdersByStatusController, getReportOrderController, setOrderCompletedController, setOrderReadyController, startCookingController, validatePaymentController } from "../services/order-service/order.controller";

const OrderRouter = Router();

OrderRouter.post("/create-order", authenticateToken, authorizeRole(["CASHIER", "WAITER", "KIOSK_SYSTEM", "CUSTOMER", "GUEST"]), createOrderController);
OrderRouter.patch("/:id/validate-payment", authenticateToken, authorizeRole(["CASHIER"]), validatePaymentController);
OrderRouter.patch("/:id/start-cooking", authenticateToken, authorizeRole(["KITCHEN"]), startCookingController);
OrderRouter.patch("/:id/ready", authenticateToken, authorizeRole(["KITCHEN"]), setOrderReadyController);
OrderRouter.patch("/:id/completed", authenticateToken, authorizeRole(["WAITER"]), setOrderCompletedController);
OrderRouter.get("/my-order/:id", authenticateToken, authorizeRole(["CUSTOMER"]), getMyOrderByIdController);
OrderRouter.get("/my-order", authenticateToken, authorizeRole(["CUSTOMER"]), getMyAllOrderController);
OrderRouter.get("/report", authenticateToken, authorizeRole(["CASHIER"]), getReportOrderController);
OrderRouter.get("/", authenticateToken, authorizeRole(["CASHIER", "WAITER", "KITCHEN"]), getOrdersByStatusController);
OrderRouter.get("/:id", authenticateToken, authorizeRole(["CASHIER", "WAITER", "KITCHEN"]), getOrderByIdController);

export default OrderRouter;