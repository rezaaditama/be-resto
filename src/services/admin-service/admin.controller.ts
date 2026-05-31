import { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import { registerStaffSchema, updateStaffPasswordSchema } from "../../schemas/admin.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAllCustomersService, getAllStaffService, getDetailStaffService, registerStaffService, updateStaffPasswordService } from "./admin.service";
import { responseSuccess } from "../../utils/response";

// controller register staff
export const registerStaffController = asyncHandler(async (req: Request, res: Response) => {

    // input validation by zod
    const inputValidation = registerStaffSchema.safeParse(req.body);

    // if validation failed
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    };

    // register staff service
    const result = await registerStaffService(inputValidation.data);

    // response success
    return responseSuccess(res, "Staff berhasil didaftarkan", result, 201)
});

// Get All Customers Controller
export const getAllCustomersController = asyncHandler(async (req: Request, res: Response) => {
    
    // Ambil data dari service
    const customers = await getAllCustomersService();

    // Kembalikan response
    res.status(200).json({
        success: true,
        message: "Berhasil mengambil semua data customer",
        count: customers.length, // Menampilkan total jumlah customer
        data: customers
    });
});

// Get All Staff Controller
export const getAllStaffController = asyncHandler(async (req: Request, res: Response) => {

    // Ambil data staff dari service
    const staffList = await getAllStaffService();

    // Kembalikan response JSON
    res.status(200).json({
        success: true,
        message: "Berhasil mengambil semua data staff",
        count: staffList.length, // Menampilkan total jumlah staff yang terdaftar
        data: staffList
    });
});

// Get Detail Staff Controller
export const getDetailStaffController = asyncHandler(async (req: Request, res: Response) => {
    
    // get id from params
    const { id } = req.params;

    // validate id
    if (typeof id !== "string") {
        throw new AppError("ID Staff tidak valid", 400);
    }

    // get detail staff service
    const staff = await getDetailStaffService(id);

    // response success
    return responseSuccess(res, "Berhasil mengambil detail staff", staff, 200);
});

// Update Staff Password Controller
export const updateStaffPasswordController = asyncHandler(async (req: Request, res: Response) => {
    
    // get id from params
    const { id } = req.params;

    // validate id
    if (typeof id !== "string") {
        throw new AppError("ID Staff tidak valid", 400);
    }

    // input validation by zod
    const inputValidation = updateStaffPasswordSchema.safeParse(req.body);

    // if validation failed
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // update staff password service
    const result = await updateStaffPasswordService(id, inputValidation.data);

    // response success
    return responseSuccess(res, result.message, null, 200);
});