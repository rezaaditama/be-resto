import { Request, Response } from "express";
import { createCategorySchema } from "../../schemas/category.schemas";
import { createCategoryService } from "./category.service";
import { responseSuccess } from "../../utils/response";
import { asyncHandler } from "../../utils/asyncHandler";


export const addCategoryController = asyncHandler(async (req: Request, res: Response) => {

    // validate input zod
    const validation = createCategorySchema.safeParse(req.body);

    // if validation failed
    if (!validation.success) {
        const error: any = new Error("Validasi gagal");
        error.status = 400,
        error.errors = validation.error.flatten().fieldErrors;
        throw error;
    }

    // create new category
    const result = await createCategoryService(validation.data.name);

    // Response success
    return responseSuccess(res, "Kategori berhasil dibuat", result, 201)
});