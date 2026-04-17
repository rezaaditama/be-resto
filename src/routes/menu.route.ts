import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { createMenuController, getAllMenuController, getMenuByIdController, updateMenuController } from "../services/menu/menu.controller";
import { uploadMenuImage } from "../middlewares/upload.middleware";

const MenuRouter = Router();

MenuRouter.get("/", getAllMenuController);
MenuRouter.get("/:id", getMenuByIdController);
MenuRouter.post("/create-menu", authenticateToken, authorizeRole(["CASHIER"]), uploadMenuImage.single("image_path"), createMenuController);
MenuRouter.patch("/update-menu/:id", authenticateToken, authorizeRole(["CASHIER"]), updateMenuController);

export default MenuRouter;
