import { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthRequest } from "../../types/auth.types";
import { updateProfileSchema, updateStaffSchema } from "./profile.schemas";
import { responseSuccess } from "../../utils/response";
import { completeCustomerProfileService, getCustomerAddressesService, getCustomerProfileService, getStaffProfileService, updateStaffService } from "./profile.service";

export const updateProfileController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    // 1. Validasi input menggunakan Zod
    const inputValidation = updateProfileSchema.safeParse(req.body);

    // Jika validasi gagal, lempar AppError (persis dengan kodemu sebelumnya)
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // 2. Ambil user ID dari middleware authenticateToken
    const userId = req.user!.id; 

    // 3. Panggil service
    const result = await completeCustomerProfileService(userId, inputValidation.data);

    // 4. Kirim response menggunakan utility responseSuccess
    return responseSuccess(res, "Profil dan alamat berhasil diperbarui", result);
});

export const getProfileController = async (req: AuthRequest, res: Response) => {
    try {
        // req.user.id ini hasil dari JWT token yang dibongkar oleh middleware
        const customerId = req.user!.id; 

        // Lempar ID tersebut ke service
        const profileData = await getCustomerProfileService(customerId);

        // Kembalikan hasilnya ke Frontend
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil profil customer",
            data: profileData
        });
    } catch (error) {
        // Tangani error
    }
}

// get address controller
export const getAddressController = async (req: AuthRequest, res: Response) => {
    try {
        // Ambil ID dari token
        const customerId = req.user!.id; 

        // Panggil service khusus alamat
        const myAddresses = await getCustomerAddressesService(customerId);

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil daftar alamat",
            data: myAddresses
        });
    } catch (error) {
        // ...
    }
}

// Get Staff Profile Controller
export const getStaffProfileController = asyncHandler(async (req: Request, res: Response) => {
    
    // Ambil ID Staff dari token JWT yang sudah di-decode oleh middleware auth
    const staffId = (req as any).user?.id;

    // Jaga-jaga jika middleware auth tidak menyertakan ID
    if (!staffId) {
        throw new AppError("Akses ditolak, ID pengguna tidak ditemukan di dalam token", 401);
    }

    // Panggil fungsi service untuk mengambil data dari database
    const staffProfile = await getStaffProfileService(staffId);

    // Kirim response sukses dengan data profile yang bersih
    res.status(200).json({
        success: true,
        message: "Berhasil mengambil data profil staff",
        data: staffProfile
    });
});

// Update Profil Sendiri (Khusus Staff yang sedang login)
export const updateSelfStaffController = asyncHandler(async (req: Request, res: Response) => {
    
    // 1. Ambil ID dan Role langsung dari token JWT
    const staffId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!staffId) {
        throw new AppError("Akses ditolak, ID tidak ditemukan di dalam token", 401);
    }

    // 2. Validasi input menggunakan Zod Schema yang sudah kita buat sebelumnya
    const validatedData = updateStaffSchema.parse(req.body);

    // Keamanan Tambahan: Pastikan staff biasa tidak bisa menyusupkan data 'role' atau 'is_active'
    if (validatedData.role || validatedData.is_active !== undefined) {
        throw new AppError("Akses ditolak! Anda tidak diizinkan mengubah Role atau Status Aktif Anda sendiri", 403);
    }

    // 3. Panggil service yang sama (tinggal oper staffId dari JWT)
    const updatedStaff = await updateStaffService(staffId, validatedData, userRole);

    res.status(200).json({
        success: true,
        message: "Berhasil memperbarui profil Anda",
        data: updatedStaff
    });
});

// Update Staff Controller
export const updateStaffController = asyncHandler(async (req: Request, res: Response) => {
    
    const targetStaffId = req.params.id as string; 
    const requestUserId = (req as any).user?.id;   
    const requestUserRole = (req as any).user?.role; 

    if (!targetStaffId) {
        throw new AppError("ID Staff harus disertakan di URL", 400);
    }

    // Aturan main: Jika bukan Admin, hanya boleh mengedit ID-nya sendiri
    if (requestUserRole !== "ADMIN" && requestUserRole !== "ADMIN_ROLE") {
        if (targetStaffId !== requestUserId) {
            throw new AppError("Akses ditolak! Anda tidak diizinkan mengubah profil staff lain", 403);
        }
    }

    // ─── VALIDASI ZOD DI SINI ──────────────────────────────────────────
    // Jika data yang dikirim tidak sesuai schema, Zod otomatis melempar error
    const validatedData = updateStaffSchema.parse(req.body);

    // Panggil service dengan mengirimkan data yang SUDAH DIVALIDASI oleh Zod
    const updatedStaff = await updateStaffService(targetStaffId, validatedData, requestUserRole);

    res.status(200).json({
        success: true,
        message: "Berhasil memperbarui data akun staff",
        data: updatedStaff
    });
});