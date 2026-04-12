import { Router } from "express";
import { createTableController, deleteTableController, getAllTablesControler, updateTableController } from "../services/table-service/table.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const TableRouter = Router();

TableRouter.get("/tables", authenticateToken, getAllTablesControler);
TableRouter.post("/create-tables", authenticateToken, createTableController);
TableRouter.put("/update-tables/:id", authenticateToken, updateTableController);
TableRouter.delete("/delete-tables/:id", authenticateToken, deleteTableController);

export default TableRouter;