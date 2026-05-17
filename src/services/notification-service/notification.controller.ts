// src/modules/notifications/notification.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler"; // Sesuaikan dengan path aslimu
import { AppError } from "../../utils/appError";         // Sesuaikan dengan path aslimu
import { getNotificationsByRoleService, markNotificationAsReadService, markAllNotificationsAsReadService } from "./notification.service";

// Get notifications controller
export const getNotificationsController = asyncHandler(async (req: Request, res: Response) => {
    
    // Get role and id from authenticated user (dari middleware auth)
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    // if role not found
    if (!userRole) {
        throw new AppError("Akses ditolak, role pengguna tidak ditemukan", 403);
    }

    // Get data notifications from service
    // userRole dan userId dilempar agar service bisa memfilter dengan tepat (terutama untuk CUSTOMER)
    const notifications = await getNotificationsByRoleService(userRole, userId);

    // Response success
    res.status(200).json({
        success: true,
        message: "Berhasil mengambil data notifikasi",
        data: notifications
    });
});

// Mark notification as read controller
export const markNotificationAsReadController = asyncHandler(async (req: Request, res: Response) => {
    
    // Get notification id from params and cast as string to prevent TS error
    const notificationId = req.params.id as string;

    // if notification id not provided
    if (!notificationId) {
        throw new AppError("ID Notifikasi harus disertakan", 400);
    }

    // Update read status via service
    const updatedNotification = await markNotificationAsReadService(notificationId);

    // Response success
    res.status(200).json({
        success: true,
        message: "Notifikasi berhasil ditandai sudah dibaca",
        data: updatedNotification
    });
});

// Mark all notifications as read controller
export const markAllAsReadController = asyncHandler(async (req: Request, res: Response) => {
    
    // Get role from authenticated user
    const userRole = (req as any).user?.role;

    // if role not found
    if (!userRole) {
        throw new AppError("Akses ditolak, role pengguna tidak ditemukan", 403);
    }

    // Update all notifications status via service
    const result = await markAllNotificationsAsReadService(userRole);

    // Response success
    res.status(200).json({
        success: true,
        message: `Berhasil menandai ${result.count} notifikasi sebagai sudah dibaca`
    });
});