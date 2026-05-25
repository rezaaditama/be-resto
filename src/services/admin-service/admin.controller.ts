import { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import { registerStaffSchema } from "../../schemas/admin.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { responseSuccess } from "../../utils/response";
import { 
    getAllCustomersService, 
    getAllStaffService, 
    registerStaffService,
    getStaffByIdService,
    deleteStaffService,
    changeStaffPasswordService,
    getDashboardStats,
    getReportService
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
export const getStaffByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params; 
    const staff = await getStaffByIdService(id);
    
    res.status(200).json({ 
        success: true, 
        message: "Berhasil mengambil detail pegawai", 
        data: staff 
    });
});

export const deleteStaffController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await deleteStaffService(id);
    
    res.status(200).json({ 
        success: true, 
        message: result.message 
    });
});

export const changeStaffPasswordController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPassword, confirmPassword } = req.body; 

    if (!newPassword || !confirmPassword) {
        throw new AppError("Password baru dan konfirmasi password wajib diisi", 400);
    }
    if (newPassword !== confirmPassword) {
        throw new AppError("Konfirmasi password tidak cocok", 400);
    }

    const result = await changeStaffPasswordService(id, newPassword);
    
    res.status(200).json({ 
        success: true, 
        message: result.message 
    });
});


// =========================================================
// 4. CONTROLLER DASHBOARD & LAPORAN (REPORTS)
// =========================================================

export const getDashboardController = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as any;

    if (!startDate || !endDate) {
        throw new AppError("Rentang tanggal (startDate dan endDate) wajib diisi", 400);
    }

    const stats = await getDashboardStats(startDate, endDate);
    
    res.status(200).json({
        success: true,
        message: "Berhasil mengambil data dashboard",
        data: stats
    });
});

export const getReportController = asyncHandler(async (req: Request, res: Response) => {
    // Tangkap semua parameter yang dibutuhkan untuk filter kompleks
    const { type, reportCategory, startDate, endDate, months, year, page, limit } = req.query as any;
    
    // Konversi parameter 'months' menjadi array angka (untuk filter checkbox bulanan)
    const monthArray = months ? (Array.isArray(months) ? months.map(Number) : [Number(months)]) : undefined;
    
    // Panggil service dengan parameter yang sudah diformat
    const reportData = await getReportService(
        type, 
        reportCategory || 'all', // default ke 'all' jika kategori laporan tidak dikirim
        startDate, 
        endDate, 
        monthArray, 
        year,
        page ? Number(page) : 1, // Default halaman 1
        limit ? Number(limit) : 10 // Default 10 data per halaman (Pagination)
    );
    
    res.status(200).json({
        success: true,
        message: `Berhasil mengambil data laporan ${type || 'umum'}`,
        ...reportData // Ini akan mengeluarkan { data: [...], meta: { page, limit } }
    });
});