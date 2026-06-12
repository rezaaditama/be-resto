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

        // Langsung tembak ke tabel notifications, tidak perlu muter lewat orders
        const customerNotifications = await prisma.notifications.findMany({
            where: {
                target_role: null, // KUNCI UTAMA: Hanya ambil notif yang target_role-nya NULL
                order: {
                    customer_id: userId // Pastikan notif ini nyambung ke orderan milik customer tersebut
                }
            },
            orderBy: {
                created_at: 'desc' // Yang paling baru di atas
            }
        });

        // Format data agar sesuai dengan kebutuhan Frontend
        const cleanCustomerNotifications = customerNotifications.map((notif: any) => ({
            id: notif.id,            // Tambahkan ID untuk key mapping di Frontend (React/Flutter)
            title: notif.tittle,     // Mengubah 'tittle' dari DB menjadi 'title' di JSON
            order_id: notif.order_id,
            message: notif.message,
            is_read: notif.is_read,
            created_at: notif.created_at,
            updated_at: notif.updated_at
        }));

        return cleanCustomerNotifications;
    }

    // =======================================================
    // 2. JIKA YANG REQUEST ADALAH STAFF (CASHIER, KITCHEN, dll)
    // =======================================================
    // Jika staff, langsung ambil semua data berdasarkan divisinya
    const notifications = await prisma.notifications.findMany({
        where: {
            target_role: role as any // 'as any' agar bebas dari garis merah TypeScript
        },
        orderBy: [
            { created_at: 'desc' }
        ],
        select: {
            id: true,
            order_id: true,
            tittle: true,      
            message: true,     
            is_read: true,     
            created_at: true,  
            updated_at: true,
            order: {
                select: {
                    // Masuk lagi ke relasi meja (Sesuaikan kata 'tables' dengan nama relasi di schemamu)
                    table: { 
                        select: {
                            // Sesuaikan kata 'table_number' dengan nama kolom asli di tabel meja
                            table_number: true 
                        }
                    }
                }
            }   
        }
    });

    const formattedNotifications = notifications.map((notif) => ({
        id: notif.id,
        order_id: notif.order_id,
        title: notif.tittle, // Ubah dari tittle (database) menjadi title (JSON)
        message: notif.message,
        is_read: notif.is_read,
        created_at: notif.created_at,
        updated_at: notif.updated_at,
        table_number: notif.order?.table?.table_number || "Takeaway"
    }));

    return formattedNotifications;
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