import { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import { deleteStaffSchema, registerStaffSchema, updateStaffPasswordSchema } from "../../schemas/admin.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { responseSuccess } from "../../utils/response";

// Import digabung jadi satu agar rapi dan tidak bentrok
import { 
    getAllCustomersService, 
    getAllStaffService, 
    registerStaffService,
    getDetailStaffService, // Memakai yang ini untuk get by id
    deleteStaffService,
    updateStaffPasswordService, // Memakai yang ini karena pakai Zod Schema
    getDashboardStats,
    // getReportService
} from "./admin.service";

// =========================================================
// 1. CONTROLLER REGISTER STAFF
// =========================================================
export const registerStaffController = asyncHandler(async (req: Request, res: Response) => {
    const inputValidation = registerStaffSchema.safeParse(req.body);

    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    };

    const result = await registerStaffService(inputValidation.data);
    return responseSuccess(res, "Staff berhasil didaftarkan", result, 201)
});

// =========================================================
// 2. CONTROLLER GET ALL CUSTOMERS & STAFF (Dengan Query)
// =========================================================
export const getAllCustomersController = asyncHandler(async (req: Request, res: Response) => {
    const queryParams = req.query;
    const customers = await getAllCustomersService(queryParams);

    res.status(200).json({
        success: true,
        message: "Berhasil mengambil semua data customer",
        count: customers.length,
        data: customers
    });
});

export const getAllStaffController = asyncHandler(async (req: Request, res: Response) => {
    const queryParams = req.query;
    const staffList = await getAllStaffService(queryParams);

    res.status(200).json({
        success: true,
        message: "Berhasil mengambil semua data staff",
        count: staffList.length,
        data: staffList
    });
});

// =========================================================
// 3. CONTROLLER AKSI PEGAWAI (DETAIL, HAPUS, & UBAH PASSWORD)
// =========================================================
export const getDetailStaffController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
        throw new AppError("ID Staff tidak valid", 400);
    }

    const staff = await getDetailStaffService(id);
    return responseSuccess(res, "Berhasil mengambil detail staff", staff, 200);
});

export const deleteStaffController = asyncHandler(async (req: Request, res: Response) => {

    const inputValidation = deleteStaffSchema.safeParse(req.params);

    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    const result = await deleteStaffService(inputValidation.data.id);
    return responseSuccess(res, result.message, null, 200);
});

export const updateStaffPasswordController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
        throw new AppError("ID Staff tidak valid", 400);
    }

    const inputValidation = updateStaffPasswordSchema.safeParse(req.body);

    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    const result = await updateStaffPasswordService(id, inputValidation.data);
    return responseSuccess(res, result.message, null, 200);
});

// =========================================================
// 4. CONTROLLER DASHBOARD & LAPORAN (REPORTS)
// =========================================================
export const getDashboardController = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as any;
    const stats = await getDashboardStats(startDate, endDate);
    
    res.status(200).json({
        success: true,
        message: "Berhasil mengambil data dashboard",
        data: stats
    });
});

// export const getReportController = asyncHandler(async (req: Request, res: Response) => {
//     const { type, reportCategory, startDate, endDate, months, year, month, page, limit } = req.query as any;
    
//     const monthArray = months ? (Array.isArray(months) ? months.map(Number) : [Number(months)]) : undefined;
    
//     const reportData = await getReportService(
//         type, 
//         reportCategory || 'all', 
//         startDate, 
//         endDate, 
//         monthArray, 
//         year,
//         month ? Number(month) : undefined,   
//         page ? Number(page) : 1,             
//         limit ? Number(limit) : 10           
//     );
    
//     res.status(200).json({
//         success: true,
//         message: `Berhasil mengambil data laporan ${type || 'umum'}`,
//         ...reportData 
//     });
// }); // <--- INI DIA KURUNG TUTUP YANG TADI HILANG!