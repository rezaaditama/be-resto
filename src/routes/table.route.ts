import { Router } from "express";
import { createTableController, deleteTableController, getAllTablesControler, updateTableController } from "../services/table-service/table.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";

const TableRouter = Router();

TableRouter.get("/", authenticateToken, getAllTablesControler);
TableRouter.post("/create-tables", authenticateToken, authorizeRole(["CASHIER"]), createTableController);
TableRouter.put("/update-tables/:id", authenticateToken, authorizeRole(["CASHIER", "WAITER"]), updateTableController);
TableRouter.delete("/delete-tables/:id", authenticateToken, authorizeRole(["CASHIER"]), deleteTableController);

export default TableRouter;