import { Router } from "express";
import { addCategoryController, getAllCategoryController } from "../services/category/category.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";

const CategoryRouter = Router();

CategoryRouter.post("/", authenticateToken, authorizeRole(["ADMIN"]), addCategoryController);
CategoryRouter.get("/", getAllCategoryController);

export default CategoryRouter;