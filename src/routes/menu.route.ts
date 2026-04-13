import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { createMenuController, getAllMenuController } from "../services/menu/menu.controller";

const MenuRouter = Router();

MenuRouter.get("/", getAllMenuController)
MenuRouter.post("/create-menu", authenticateToken, authorizeRole(["ADMIN"]), createMenuController);

export default MenuRouter;
