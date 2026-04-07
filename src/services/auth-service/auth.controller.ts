import { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import { loginSchema, registerCustomerSchema, verifyOtpSchema } from "../../schemas/auth.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginUserService, registerCustomerService, verifyCodeOtpService } from "./auth.service";
import { responseSuccess } from "../../utils/response";

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