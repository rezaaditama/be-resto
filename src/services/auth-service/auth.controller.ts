import { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import { forgotPasswordSchema, loginSchema, registerCustomerSchema, registerStaffSchema, resendOtpSchema, resetPasswordSchema, verifyOtpSchema, verifyResetOtpSchema } from "../../schemas/auth.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { forgotPasswordService, loginUserService, logoutUserService, registerCustomerService, registerStaffService, resendForgotPasswordOtpService, resendOtpService, resetPasswordService, verifyCodeOtpService, verifyResetOtpService } from "./auth.service";
import { responseSuccess } from "../../utils/response";
import { AuthRequest } from "src/types/auth.types";

// Controller user login
export const loginUserController = asyncHandler(async (req: Request, res: Response) => {

    // Validate input by zod
    const inputValidation = loginSchema.safeParse(req.body);

    // If validation failed
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // login service
    const result = await loginUserService(inputValidation.data);

    // response success
    return responseSuccess(res, "Login berhasil", {
        token: result.token,
        user: result.user
    });
});

// Controller register customer
export const registerCustomerController = asyncHandler(async (req: Request, res: Response) => {
    
    // Validate input by zod
    const inputValidation = registerCustomerSchema.safeParse(req.body);

    // If validation failed
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // Register customer service
    const result = await registerCustomerService(inputValidation.data);

    // Response success
    return responseSuccess(res, result.message, {email: result.email});
});

// Controller verify OTP
export const verifyOtpController = asyncHandler(async (req: Request, res: Response) => {

    // Validate input by ZOD
    const inputValidation = verifyOtpSchema.safeParse(req.body);

    // If validation failed
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // verify OTP service
    const result = await verifyCodeOtpService(inputValidation.data);

    // Response success
    responseSuccess(res, result.message);
});

// resend OTP code controller
export const resendOtpController = asyncHandler(async (req: Request, res: Response) => {
    // Validasi input
    const inputValidation = resendOtpSchema.safeParse(req.body);
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // Panggil service
    const result = await resendOtpService(inputValidation.data);

    // Response sukses
    return responseSuccess(res, result.message);
});

// logout users(customer & staff) controller
export const logoutUserController = asyncHandler(async (req: AuthRequest, res: Response) => {
    // req.user diisi oleh middleware authenticateToken
    const { id, role } = req.user!; 

    // Panggil service
    const result = await logoutUserService(id, role);

    // Kirim response menggunakan utility responseSuccess Anda
    return responseSuccess(res, result.message);
});

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

// Controller untuk meminta OTP (Lupa Password)
export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
    
    // 1. Validasi input email menggunakan Zod
    const inputValidation = forgotPasswordSchema.safeParse(req.body);

    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // 2. Panggil service untuk cari user dan kirim OTP
    const result = await forgotPasswordService(inputValidation.data);

    // 3. Berikan response sukses
    return responseSuccess(res, result.message);
});

// Verifikasi OTP
export const verifyResetOtpController = asyncHandler(async (req: Request, res: Response) => {
    const inputValidation = verifyResetOtpSchema.safeParse(req.body);
    if (!inputValidation.success) throw new AppError("Validasi gagal", 400);

    const result = await verifyResetOtpService(inputValidation.data);
    return responseSuccess(res, "OTP Valid, silakan ganti password", result);
});

// Resend Otp forgot password
export const resendForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
        // 1. Lakukan validasi langsung di dalam Controller menggunakan schema
        const validation = resendOtpSchema.safeParse(req.body);

        // 2. Jika frontend mengirim data yang salah atau kosong
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validasi gagal",
                // Zod akan memberikan daftar error yang rapi (misal: "Email wajib diisi")
                errors: validation.error.flatten().fieldErrors 
            });
        }

        // 3. Ekstrak data yang SUDAH LOLOS validasi dan sudah di-lowercase
        // Jangan pakai req.body lagi di bawah baris ini!
        const validatedData = validation.data;

        // 4. Lempar data yang sudah aman ke Service
        const result = await resendForgotPasswordOtpService(validatedData);

        // 5. Kembalikan respons sukses
        res.status(200).json(result);

    } catch (error: any) {
        // Tangani error dari Service (misal: "Email tidak terdaftar")
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Terjadi kesalahan pada server"
        });
    }
};

// Reset Password
export const resetPasswordController = asyncHandler(async (req: AuthRequest, res: Response) => {
    const inputValidation = resetPasswordSchema.safeParse(req.body);
    if (!inputValidation.success) throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);

    // Ambil user ID dari middleware authenticateToken
    const userId = req.user!.id; 
    const result = await resetPasswordService(userId, inputValidation.data);

    return responseSuccess(res, result.message);
});
