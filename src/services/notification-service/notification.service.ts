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
        
        if (!userId) {
            throw new AppError("ID Customer diperlukan untuk melihat notifikasi", 400);
        }

        // 1. Ambil orderan milik customer ini berserta semua notifikasinya
        const customerOrdersWithNotifications = await prisma.orders.findMany({
            where: {
                customer_id: userId 
            },
            include: {
                notifications: true 
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // 2. Olah data untuk memfilter dan membersihkan response
        const cleanCustomerNotifications = customerOrdersWithNotifications
            .flatMap(order => {
                return (order as any).notifications
                    // FILTER 1: Buang notifikasi verifikasi kasir.
                    // Kita kecualikan notif yang tittle-nya mengandung kata "Validasi" atau "Verifikasi"
                    .filter((notif: any) => 
                        !notif.tittle.toLowerCase().includes("validasi") && 
                        !notif.tittle.toLowerCase().includes("verifikasi")
                    )
                    // FILTER 2: Batasi field data yang dikembalikan (Hanya yang kamu minta)
                    .map((notif: any) => ({
                        tittle: notif.tittle, // Sesuaikan typo database 'tittle'
                        message: notif.message,
                        is_read: notif.is_read,
                        created_at: notif.created_at,
                        updated_at: notif.updated_at
                    }));
            })
            // 3. Urutkan ulang berdasarkan waktu notifikasi yang terbaru di paling atas
            .sort((a: any, b: any) => b.created_at.getTime() - a.created_at.getTime());

        return cleanCustomerNotifications;
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
        select: {
            id: true,
            tittle: true,      
            message: true,     
            is_read: true,     
            created_at: true,  
            updated_at: true   
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