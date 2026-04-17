import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response } from "express";
import { createMenuService, getAllMenuService, getMenuByIdService, updateMenuService } from "./menu.service";
import { responseSuccess } from "../../utils/response";
import { createMenuSchema, getMenuByIdSchema, getMenuFilterSchema, updateMenuSchema } from "../../schemas/menu.schemas";
import { AuthRequest } from "../../types/auth.types";
import { AppError } from "../../utils/appError";
import fs from "fs";

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

    // check if image is uploaded
    if (!req.file) {
        throw new AppError("Gambar menu harus diunggah", 400);
    }

    // normalize image path
    const normalizedPath = req.file.path.replace(/\\/g, "/");

    // input validation by zod
    const inputValidation = createMenuSchema.safeParse(req.body);

    // if input validation failed delete image and throw error
    if (!inputValidation.success) {
        if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // create menu service
    const result = await createMenuService({...inputValidation.data, image_path: normalizedPath});

    // response success
    return responseSuccess(res, "Menu berhasil ditambahkan", result, 201);
});

// Get menu by id controller
export const getMenuByIdController = asyncHandler(async (req: Request, res: Response) => {

    // get id from params
    const {id} = getMenuByIdSchema.parse(req.params);

    // validation failed
    if (!id) {
        throw new AppError("Validasi gagal", 400);
    };

    // get menu by id service
    const result = await getMenuByIdService(id);

    // response success
    return responseSuccess(res, "Berhasil mendapatkan data menu berdasarkan id", result);
});

// Update menu controller
export const updateMenuController = asyncHandler(async (req: Request, res: Response) => {

    // validate id from params
    const { id } = getMenuByIdSchema.parse(req.params);

    const inputValidation = updateMenuSchema.safeParse(req.body);

    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    };

    // update stock service
    const result = await updateMenuService(id, inputValidation.data);

    // return response success
    return responseSuccess(res, "Menu berhasil di perbarui", result)
});