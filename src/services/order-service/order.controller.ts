import { asyncHandler } from "../../utils/asyncHandler";
import { Response } from "express";
import { AuthRequest } from "../../types/auth.types";
import { createOrderSchema } from "../../schemas/order.schemas";
import { AppError } from "../../utils/appError";
import { createOrderService } from "./order.service";
import { responseSuccess } from "../../utils/response";

export const createOrderController = asyncHandler(async (req: AuthRequest, res: Response) => {

    const validatedData = createOrderSchema.safeParse(req.body);

    // if validation failed
    if (!validatedData.success) {
        throw new AppError("Validasi gagal", 400, validatedData.error.flatten().fieldErrors);
    };

    // get source from validated data
    const { source } = validatedData.data;

    // get requester id from JWT user
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    // if requester id not found and source is not QR_SCAN
    if (!requesterId && source !== "QR_SCAN") {
        throw new AppError("Sesi tidak valid, silakan login kembali untuk membuat pesanan ini", 401);
    };  

    const newOrder = await createOrderService(validatedData.data, requesterId, requesterRole);

    return responseSuccess(
        res, 
        "Pesanan berhasil dibuat, silakan lakukan pembayaran di kasir", 
        newOrder, 
        201
    );   
});