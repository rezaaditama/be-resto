import { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthRequest } from "../../types/auth.types";
import { updateProfileSchema } from "../../schemas/profile.schemas";
import { responseSuccess } from "../../utils/response";
import { completeCustomerProfileService, getCustomerAddressesService, getCustomerProfileService } from "./profile.service";

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