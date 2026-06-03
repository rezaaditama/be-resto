import { Router } from "express";
import { autoAssignTableController, createTableController, deleteTableController, getAllTablesControler, getTableByIdController, updateTableController, verifyTableIdController } from "./table.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { authorizeRole } from "../../middlewares/role.middleware";

const TableRouter = Router();

TableRouter.get("/", authenticateToken, getAllTablesControler);
TableRouter.get("/verify/:id", authenticateToken, authorizeRole(["KIOSK_SYSTEM", "GUEST"]), verifyTableIdController);
TableRouter.get("/:id", authenticateToken, authorizeRole(["CASHIER", "WAITER"]), getTableByIdController);
TableRouter.post("/create-tables", authenticateToken, authorizeRole(["CASHIER"]), createTableController);
TableRouter.post("/auto-assign", authenticateToken, authorizeRole(["KIOSK_SYSTEM"]), autoAssignTableController);
TableRouter.put("/update-tables/:id", authenticateToken, authorizeRole(["CASHIER", "WAITER", "KIOSK_SYSTEM"]), updateTableController);
TableRouter.delete("/delete-tables/:id", authenticateToken, authorizeRole(["CASHIER"]), deleteTableController);

export default TableRouter;