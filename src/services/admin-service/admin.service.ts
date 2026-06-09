import prisma from "../../lib/prisma";
import { RegisterStaffInput } from "../../schemas/admin.schemas";
import { AppError } from "../../utils/appError";
import bcrypt from "bcrypt";

// =====================================================================
// 1. MANAJEMEN STAFF & CUSTOMER
// =====================================================================

export const registerStaffService = async (data: RegisterStaffInput) => {
    const normalizedEmail = data.email.toLowerCase();
    
    const existingStaffEmail = await prisma.staff.findUnique({
        where: {email: normalizedEmail}
    });

    const existingCustomerEmail = await prisma.customers.findUnique({
        where: {email: normalizedEmail}
    });

    if (existingStaffEmail || existingCustomerEmail) {
        throw new AppError("Email sudah terdaftar", 409);
    };

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newStaff = await prisma.staff.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword,
            fullname: data.fullname,
            role: data.role,
            gender: data.gender,
            phone_number: data.phone_number,
            is_active: true
        }
    });

    return {
        message: "Registrasi akun staff berhasil",
        id: newStaff.id,
        fullName: newStaff.fullname,
        role: newStaff.role
    };
};

// Gabungan: Fitur Sorting (Jat) + Fitur Address (Teman)
export const getAllCustomersService = async (query: any) => {
    const { sortBy, sortOrder } = query;
    let sorting: any = { created_at: 'desc' }; 
    
    if (sortBy && sortOrder) {
        sorting = { [String(sortBy)]: String(sortOrder).toLowerCase() };
    }

    const customers = await prisma.customers.findMany({
        orderBy: sorting,
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            gender: true,
            date_of_birth: true,
            is_validated: true,
            created_at: true,
            address: {
                where: { is_core_address: true },
                select: { address_name: true },
                take: 1
            }
        }
    });

    const formattedCustomers = customers.map(customer => {
        const primaryAddressName = customer.address.length > 0 
            ? customer.address[0].address_name 
            : "Belum mengatur alamat";

        const { address, ...customerDataWithoutAddressArray } = customer;

        return {
            ...customerDataWithoutAddressArray,
            address_name: primaryAddressName 
        };
    });

    return formattedCustomers;
};

// Fitur Sorting & Filter Staff (Dibersihkan duplikasinya)
export const getAllStaffService = async (query: any) => {
    const { search, role, status, sortBy, sortOrder } = query;
    const filterWhere: any = {};

    if (search) {
        filterWhere.OR = [
            { fullname: { contains: String(search), mode: 'insensitive' } },
            { email: { contains: String(search), mode: 'insensitive' } }
        ];
    }

    if (role) filterWhere.role = String(role);
    if (status) filterWhere.is_active = status === 'Aktif' ? true : false;

    let sorting: any = { created_at: 'desc' }; 
    if (sortBy && sortOrder) {
        sorting = { [String(sortBy)]: String(sortOrder).toLowerCase() };
    }

    const allStaff = await prisma.staff.findMany({
        where: filterWhere,
        orderBy: sorting,
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            gender: true,
            role: true,        
            is_active: true,   
            created_at: true
        }
    });

    return allStaff;
};

// Menggunakan penamaan teman (getDetailStaffService) yang lebih rapi
export const getDetailStaffService = async (staffId: string) => {
    const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            role: true,
            gender: true,
            is_active: true,
            created_at: true,
            updated_at: true
        }
    });

    if (!staff) {
        throw new AppError("Data staff tidak ditemukan", 404);
    }

    return staff;
};

// Disesuaikan agar memanggil getDetailStaffService
export const deleteStaffService = async (id: string) => {
    await getDetailStaffService(id);
    await prisma.staff.delete({ where: { id } });
    return { message: "Data pegawai berhasil dihapus" };
};

// Menggunakan versi teman (updateStaffPasswordService) dengan schema Zod
export const updateStaffPasswordService = async (staffId: string, data: any) => { 
    const staff = await prisma.staff.findUnique({
        where: { id: staffId }
    });

    if (!staff) {
        throw new AppError("Data staff tidak ditemukan", 404);
    }

    if (data.new_password !== data.confirm_password) {
        throw new AppError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru", 400);
    }

    const hashedPassword = await bcrypt.hash(data.new_password, 10);

    await prisma.staff.update({
        where: { id: staffId },
        data: {
            password: hashedPassword
        }
    });

    return {
        message: "Kata sandi staff berhasil diperbarui"
    };
};

// =====================================================================
// 2. DASHBOARD & LAPORAN SERVICE (Mahakarya Jat)
// =====================================================================

export const getDashboardStats = async (startDate?: string, endDate?: string) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : now;
    
    const orders = await prisma.orders.findMany({
        where: { created_at: { gte: start, lte: end } },
        select: { grand_total_amount: true, status: true }
    });

    const topMenusAgg = await prisma.order_items.groupBy({
        by: ['menu_id'],
        where: { order: { created_at: { gte: start, lte: end } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
    });

    const menuDetails = await prisma.menus.findMany({
        where: { id: { in: topMenusAgg.map(m => m.menu_id!).filter(Boolean) } },
        select: { id: true, name: true, price: true, category: true }
    });

    const topMenus = topMenusAgg.map(agg => {
        const detail = menuDetails.find(m => m.id === agg.menu_id);
        return {
            menu_id: agg.menu_id,
            name: detail?.name,
            price: detail?.price,
            category: detail?.category,
            total_sold: agg._sum.quantity
        };
    });

    return {
        summary: {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + Number(order.grand_total_amount), 0)
        },
        topMenus
    };
};

// const namaBulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// export const getReportService = async (type: string, reportCategory: string, startDate?: string, endDate?: string, months?: number[], year?: string, month?: number, page: number = 1, limit: number = 10) => {
    
//     let whereClause: any = {};
//     const skip = (page - 1) * limit;
    
//     if (type === 'daily' && startDate && endDate) {
//         whereClause.created_at = { gte: new Date(startDate), lte: new Date(endDate) };
//     } 
//     else if (type === 'weekly' && month && year) {
//         whereClause.created_at = { 
//             gte: new Date(parseInt(year), month - 1, 1), 
//             lte: new Date(parseInt(year), month, 0, 23, 59, 59) 
//         };
//     } 
//     else if (type === 'monthly' && months && months.length > 0 && year) {
//         whereClause.OR = months.map(m => ({
//             created_at: { 
//                 gte: new Date(parseInt(year), m - 1, 1), 
//                 lte: new Date(parseInt(year), m, 0, 23, 59, 59) 
//             }
//         }));
//     }

//     const getGroupKey = (date: Date, reportType: string): string => {
//         if (reportType === 'monthly') {
//             return namaBulanIndo[date.getMonth()];
//         } else if (reportType === 'weekly') {
//             const day = date.getDate();
//             if (day <= 7) return "Minggu 1";
//             if (day <= 14) return "Minggu 2";
//             if (day <= 21) return "Minggu 3";
//             if (day <= 28) return "Minggu 4";
//             return "Minggu 5";
//         } else {
//             return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
//         }
//     };

//     switch (reportCategory) {
        
//         case 'orders': {
//             const rawOrders = await prisma.orders.findMany({
//                 where: whereClause,
//                 select: { status: true, created_at: true }
//             });

//             const groupedOrders: Record<string, any> = {};

//             rawOrders.forEach(order => {
//                 const key = getGroupKey(order.created_at, type);
                
//                 if (!groupedOrders[key]) {
//                     groupedOrders[key] = { label: key, total_pesanan: 0, pesanan_selesai: 0, pesanan_cancel: 0 };
//                 }
                
//                 groupedOrders[key].total_pesanan++;
//                 if ((order.status as string) === 'COMPLETED' || (order.status as string) === 'DONE') {
//                     groupedOrders[key].pesanan_selesai++;
//                 }
//                 if ((order.status as string) === 'CANCELLED') {
//                     groupedOrders[key].pesanan_cancel++;
//                 }
//             });

//             const finalOrdersData = Object.values(groupedOrders);
            
//             const summaryOrders = finalOrdersData.reduce((acc, curr) => {
//                 acc.total_semua += curr.total_pesanan;
//                 acc.total_selesai += curr.pesanan_selesai;
//                 acc.total_cancel += curr.pesanan_cancel;
//                 return acc;
//             }, { total_semua: 0, total_selesai: 0, total_cancel: 0 });

//             return { data: finalOrdersData, summary: summaryOrders };
//         }

//         case 'revenue': {
//             const rawRevenue = await prisma.orders.findMany({
//                 where: whereClause,
//                 select: { grand_total_amount: true, created_at: true }
//             });

//             const groupedRevenue: Record<string, any> = {};

//             rawRevenue.forEach(order => {
//                 const key = getGroupKey(order.created_at, type);
                
//                 if (!groupedRevenue[key]) {
//                     groupedRevenue[key] = { label: key, total_pesanan: 0, total_pendapatan: 0 };
//                 }
                
//                 groupedRevenue[key].total_pesanan++;
//                 groupedRevenue[key].total_pendapatan += Number(order.grand_total_amount || 0);
//             });

//             const finalRevenueData = Object.values(groupedRevenue);
            
//             const summaryRevenue = finalRevenueData.reduce((acc, curr) => {
//                 acc.total_semua_pesanan += curr.total_pesanan;
//                 acc.grand_total_pendapatan += curr.total_pendapatan;
//                 return acc;
//             }, { total_semua_pesanan: 0, grand_total_pendapatan: 0 });

//             return { data: finalRevenueData, summary: summaryRevenue };
//         }

//         case 'menu': {
//             const menuReport = await prisma.order_items.groupBy({
//                 by: ['menu_id'],
//                 where: { order: whereClause },
//                 _sum: { quantity: true },
//                 orderBy: { _sum: { quantity: 'desc' } },
//                 skip, take: limit
//             });
//             return { data: menuReport, meta: { page, limit } };
//         }

//         default: {
//             const allReport = await prisma.orders.findMany({
//                 where: whereClause,
//                 include: { order_items: true },
//                 orderBy: { created_at: 'desc'