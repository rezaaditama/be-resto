import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { authorizeRole } from "../../middlewares/role.middleware";
import { createOrderController, getMyAllOrderController, getMyOrderByIdController, getOrderByIdController, getOrdersByStatusController, getReportOrderController, getSubstituteMenusController, removeOrderItemController, setOrderCompletedController, setOrderReadyController, startCookingController, swapOrderItemController, updateCancelOrderController, validatePaymentController } from "./order.controller";

const OrderRouter = Router();

OrderRouter.post("/create-order", authenticateToken, authorizeRole(["CASHIER", "WAITER", "KIOSK_SYSTEM", "CUSTOMER", "GUEST"]), createOrderController);
OrderRouter.get("/my-order", authenticateToken, authorizeRole(["CUSTOMER"]), getMyAllOrderController);
OrderRouter.get("/report", authenticateToken, authorizeRole(["CASHIER"]), getReportOrderController);
OrderRouter.get("/substitutes", authenticateToken, authorizeRole(["CASHIER"]), getSubstituteMenusController);
OrderRouter.get("/my-order/:id", authenticateToken, authorizeRole(["CUSTOMER"]), getMyOrderByIdController);
OrderRouter.get("/:id", authenticateToken, authorizeRole(["CASHIER", "WAITER", "KITCHEN"]), getOrderByIdController);
OrderRouter.get("/", authenticateToken, authorizeRole(["CASHIER", "WAITER", "KITCHEN"]), getOrdersByStatusController);
OrderRouter.patch("/:id/validate-payment", authenticateToken, authorizeRole(["CASHIER"]), validatePaymentController);
OrderRouter.patch("/:id/start-cooking", authenticateToken, authorizeRole(["KITCHEN"]), startCookingController);
OrderRouter.patch("/:id/ready", authenticateToken, authorizeRole(["KITCHEN"]), setOrderReadyController);
OrderRouter.patch("/:id/completed", authenticateToken, authorizeRole(["WAITER"]), setOrderCompletedController);
OrderRouter.patch("/:id/cancel", authenticateToken, authorizeRole(["CASHIER"]), updateCancelOrderController);
OrderRouter.patch("/:id/swap-item", authenticateToken, authorizeRole(["CASHIER"]), swapOrderItemController);
OrderRouter.patch("/:id/remove-item", authenticateToken, authorizeRole(["CASHIER"]), removeOrderItemController)

export default OrderRouter;