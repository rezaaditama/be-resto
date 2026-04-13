import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response } from "express";
import { createMenuService, getAllMenuService } from "./menu.service";
import { responseSuccess } from "../../utils/response";
import { createMenuSchema, getMenuFilterSchema } from "../../schemas/menu.schemas";
import { AuthRequest } from "../../types/auth.types";
import { AppError } from "../../utils/appError";

export const getAllMenuController = asyncHandler(async (req: Request, res: Response) => {
    
    // get query params
    const filters = getMenuFilterSchema.parse(req.query)

    // get all menu service
    const result = await getAllMenuService(filters);

    // response success
    return responseSuccess(res, "Berhasil mengambil semua data menu", result);
});

// Create new menu controller
export const createMenuController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // input validation by zod
    const inputValidation = createMenuSchema.safeParse(req.body);

    // if input validation failed
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // create menu service
    const result = await createMenuService(inputValidation.data);

    // response success
    return responseSuccess(res, "Menu berhasil ditambahkan", result, 201);
});