import { Request, Response } from "express";
import { registerSchema } from "../../schemas/auth.schemas";
import { asyncHandler } from "../../utils/asyncHandler";
import { responseSuccess } from "../../utils/response";
import { createStaffService } from "./auth.service";

export const registerStaff = asyncHandler(async (req: Request, res: Response) => {

        // validate input zod
        const validation = registerSchema.safeParse(req.body)

        // if validation failed
        if (!validation.success) {
            const error: any = new Error("Validasi gagal");
            error.status = 400;
            error.errors = validation.error.flatten().fieldErrors;
            throw error;
        }

        // Create new staff
        const newStaff = await createStaffService(validation.data);

        // Response success
        return responseSuccess(res, "Akun staff berhasil dibuat", {
            username: newStaff.username,
            role: newStaff.role
        }, 201);
    });