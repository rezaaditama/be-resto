import { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import { registerStaffSchema } from "../../schemas/admin.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAllCustomersService, getAllStaffService, registerStaffService } from "./admin.service";
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