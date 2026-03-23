import { Router } from "express";
import { addCategoryController } from "src/services/category/category.controller";

const CategoryRouter = Router();

CategoryRouter.post("/create-category", addCategoryController);

export default CategoryRouter;