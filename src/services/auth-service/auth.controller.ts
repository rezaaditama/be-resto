import { Request, Response } from "express";
import { loginSchema } from "../../schemas/auth.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginStaffService } from "./auth.service";
import { responseSuccess } from "../../utils/response";

export const loginStaff = asyncHandler(async (req: Request, res: Response) => {
        // validate input zod
        const validation = loginSchema.safeParse(req.body);

        // if validation failed
        if (!validation.success) {
            const error: any = new Error("Validasi gagal");
            error.status = 400;
            error.errors = validation.error.flatten().fieldErrors;
            throw error;
        }

        // Login service
        const result = await loginStaffService(validation.data);

        return responseSuccess(res, "Login berhasil", {
            token: result.token,
            user: {
                id: result.user.id,
                fullname: result.user.fullname,
                role: result.user.role
            }
        });
});