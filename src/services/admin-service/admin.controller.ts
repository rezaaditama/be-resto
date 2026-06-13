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
    getDetailStaffService, 
    deleteStaffService,
    updateStaffPasswordService, 
    getDashboardStats,
    getReportService 
} from "./admin.service";

// CONTROLLER REGISTER STAFF
export const registerStaffController = asyncHandler(async (req: Request, res: Response) => {
    const inputValidation = registerStaffSchema.safeParse(req.body);

    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    };

    const result = await registerStaffService(inputValidation.data);
    return responseSuccess(res, "Staff berhasil didaftarkan", result, 201)
});

// CONTROLLER GET ALL CUSTOMERS & STAFF (Dengan Query)
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

// CONTROLLER AKSI PEGAWAI (DETAIL, HAPUS, & UBAH PASSWORD)
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

// CONTROLLER DASHBOARD & LAPORAN (REPORTS)
export const getDashboardController = asyncHandler(async (req: Request, res: Response) => {
    // 1. Ekstrak dengan tipe data yang lebih aman (hindari 'any')
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // 2. Panggil service
    const stats = await getDashboardStats(startDate, endDate);
    
    // 3. Gunakan utility responseSuccess agar formatnya konsisten dengan modul lain
    return responseSuccess(res, "Berhasil mengambil data dashboard", stats, 200);
});

export const getReportController = asyncHandler(async (req: Request, res: Response) => {
    // 1. Tangkap semua parameter dengan tipe yang jelas
    const type = req.query.type as string;
    const reportCategory = req.query.reportCategory as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const year = req.query.year as string | undefined;
    
    // Parsing manual untuk parameter angka dan array
    const month = req.query.month ? Number(req.query.month) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    // Parsing khusus untuk months (bisa dikirim frontend sebagai array ?months=1&months=2)
    let monthArray: number[] | undefined = undefined;
    if (req.query.months) {
        if (Array.isArray(req.query.months)) {
            monthArray = req.query.months.map(Number);
        } else {
            monthArray = [Number(req.query.months)];
        }

        if (monthArray.some(isNaN)) {
            throw new AppError("Format parameter bulan tidak valid. Harus berupa angka.", 400);
        }
    }
    
    // 2. Eksekusi service
    const reportData = await getReportService(
        type, 
        reportCategory || 'all', 
        startDate, 
        endDate, 
        monthArray, 
        year,
        month,   
        page,            
        limit            
    );
    
    // 3. Kembalikan response
    res.status(200).json({
        success: true,
        message: `Berhasil mengambil data laporan ${type || 'umum'}`,
        ...reportData // reportData sudah berisi objek { data: [], summary: {} }
    });
});