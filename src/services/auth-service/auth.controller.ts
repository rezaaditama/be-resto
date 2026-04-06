import { Request, Response } from "express";
import { loginSchema, registerCustomerSchema, verifyOtpSchema } from "../../schemas/auth.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginUserService, registerCustomerService, verifyOtpService } from "./auth.service";
import { responseSuccess } from "../../utils/response";

// Controller user login
export const loginUserController = asyncHandler(async (req: Request, res: Response) => {

    // Validate input by zod
    const inputValidation = loginSchema.safeParse(req.body);

    // If validation failed
    if (!inputValidation.success) {
        const error: any = new Error("Validasi gagal");
        error.status = 400;
        error.errors = inputValidation.error.flatten().fieldErrors;
        throw error;
    }

    // login service
    const result = await loginUserService(inputValidation.data);

    // response success
    return responseSuccess(res, "Login berhasil", {
        token: result.token,
        user: {
            id: result.user.id,
            fullname: result.user.fullname,
            role: result.user.role
        }
    });
});

// Controller register customer
export const registerCustomerController = asyncHandler(async (req: Request, res: Response) => {
    
    // Validate input by zod
    const inputValidation = registerCustomerSchema.safeParse(req.body);

    // If validation failed
    if (!inputValidation.success) {
        const error: any = new Error("Validasi gagal");
        error.status = 400;
        error.errors = inputValidation.error.flatten().fieldErrors;
        throw error;
    }

    // Register customer service
    const result = await registerCustomerService(inputValidation.data);

    // Response success
    return responseSuccess(res, "Register berhasil, silahkan cek email untuk verifikasi kode OTP", {
        userId: result.user.id,
    });
});

// Controller verify OTP
export const verifyOtpController = asyncHandler(async (req: Request, res: Response) => {

    // Validate input by ZOD
    const inputValidation = verifyOtpSchema.safeParse(req.body);

    // If validation failed
    if (!inputValidation.success) {
        const error: any = new Error("Validasi gagal");
        error.status = 400;
        error.errors = inputValidation.error.flatten().fieldErrors;
        throw error;
    }

    // verify OTP service
    const result = await verifyOtpService(inputValidation.data);

    // Response success
    responseSuccess(res, result.message);
})
