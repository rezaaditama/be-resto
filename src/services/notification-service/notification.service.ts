// src/modules/notifications/notification.service.ts
import prisma from "../../lib/prisma";
import { AppError } from "../../utils/appError";

// FUNGSI INTERNAL: Create notification service (Dipanggil oleh service lain)
export const createNotificationInternal = async (data: { order_id: string; target_role: string; tittle: string; message: string; }) => {

    // create notification
    const newNotification = await prisma.notifications.create({
        data: {
            order_id: data.order_id,
            // Kita gunakan 'as any' agar Prisma menerima tipe string biasa tanpa perlu import Enum
            target_role: data.target_role as any, 
            tittle: data.tittle,
            message: data.message,
            is_read: false
        }
    });

    // return data notification
    return newNotification;
};

// Get all notifications by role service
// Tambahkan userId sebagai parameter opsional (tipe string biasa)
export const getNotificationsByRoleService = async (role: string, userId?: string) => {

    // =======================================================
    // 1. JIKA YANG REQUEST ADALAH CUSTOMER (PELANGGAN)
    // =======================================================
    if (role === "CUSTOMER") {
        
        // Wajib ada ID Customer agar data tidak tertukar
        if (!userId) {
            throw new AppError("ID Customer diperlukan untuk melihat notifikasi", 400);
        }

        // Ambil data dari tabel notifications
        return await prisma.notifications.findMany({
            where: {
                target_role: role as any, // 'as any' agar bebas dari garis merah TypeScript
                
                // FILTER EKSTRA: Masuk ke tabel orders, cari yang customer_id nya cocok
                order: {
                    customer_id: userId 
                }
            },
            orderBy: [
                { created_at: 'desc' }
            ],
            include: {
                order: true // Tampilkan detail ordernya juga
            }
        });
    }

    // =======================================================
    // 2. JIKA YANG REQUEST ADALAH STAFF (CASHIER, KITCHEN, dll)
    // =======================================================
    // Jika staff, langsung ambil semua data berdasarkan divisinya
    return await prisma.notifications.findMany({
        where: {
            target_role: role as any // 'as any' agar bebas dari garis merah TypeScript
        },
        orderBy: [
            { created_at: 'desc' }
        ],
        include: {
            order: true 
        }
    });
};

// Update notification read status service
export const markNotificationAsReadService = async (id: string) => {

    // check if notification exist
    const existingNotification = await prisma.notifications.findUnique({
        where: {
            id: id
        }
    });

    // if notification not found
    if (!existingNotification) {
        throw new AppError("Notifikasi tidak ditemukan", 404);
    };

    // check if already read
    if (existingNotification.is_read) {
        return existingNotification; 
    }

    // update notification status
    const updateNotification = await prisma.notifications.update({
        where: { id: id },
        data: {
            is_read: true
        }
    });

    // return updated notification data
    return updateNotification;
};

// Update all notifications as read by role service
export const markAllNotificationsAsReadService = async (role: string) => {
    
    // update multiple notifications
    const updateNotifications = await prisma.notifications.updateMany({
        
        // filtering data
        where: {
            target_role: role as any, // Akali TypeScript di sini juga
            is_read: false
        },
        
        // update status
        data: {
            is_read: true
        }
    });

    // return data notifications
    return updateNotifications;
};