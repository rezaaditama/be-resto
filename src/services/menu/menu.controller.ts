import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response } from "express";
import { getAllMenuService } from "./menu.service";
import { responseSuccess } from "../../utils/response";
import { getMenuFilterSchema } from "../../schemas/menu.schemas";

export const getAllMenuController = asyncHandler(async (req: Request, res: Response) => {
    
    // get query params
    const filters = getMenuFilterSchema.parse(req.query)

    // get all menu service
    const result = await getAllMenuService(filters);

    // response success
    return responseSuccess(res, "Berhasil mengambil semua data menu", result);
});