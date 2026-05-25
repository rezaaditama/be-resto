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
            address: true 
        }
    });

    return customers;
};

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
            role: true,        
            is_active: true,   
            created_at: true
        }
    });

    return allStaff;
};

export const getStaffByIdService = async (id: string) => {
    const staff = await prisma.staff.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            role: true,
            gender: true,
            is_active: true,
            created_at: true
        }
    });

    if (!staff) throw new AppError("Data pegawai tidak ditemukan", 404);
    return staff;
};

export const deleteStaffService = async (id: string) => {
    await getStaffByIdService(id);
    await prisma.staff.delete({ where: { id } });
    return { message: "Data pegawai berhasil dihapus" };
};

export const changeStaffPasswordService = async (id: string, newPassword: string) => {
    await getStaffByIdService(id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.staff.update({
        where: { id },
        data: { password: hashedPassword }
    });
    return { message: "Kata sandi pegawai berhasil diperbarui" };
};

// =====================================================================
// 2. DASHBOARD & LAPORAN SERVICE
// =====================================================================

// Service khusus Dashboard (Dioptimalkan untuk kecepatan)
export const getDashboardStats = async (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ambil semua pesanan dalam rentang waktu
    const orders = await prisma.orders.findMany({
        where: { created_at: { gte: start, lte: end } },
        select: { grand_total_amount: true, status: true }
    });

    // Ambil top 5 menu terlaris
    const topMenusAgg = await prisma.order_items.groupBy({
        by: ['menu_id'],
        where: { order: { created_at: { gte: start, lte: end } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
    });

    // Ambil detail nama menu berdasarkan menu_id dari agregasi
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

// Service khusus Laporan (Mendukung filter jenis laporan, multi-bulan, dan pagination)
export const getReportService = async (type: string, reportCategory: string, startDate?: string, endDate?: string, months?: number[], year?: string, page: number = 1, limit: number = 10) => {
    
    let whereClause: any = {};
    const skip = (page - 1) * limit;
    
    // Logika Rentang Waktu
    if (type === 'daily' && startDate && endDate) {
        whereClause.created_at = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (type === 'weekly' && startDate && endDate) {
        whereClause.created_at = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (type === 'monthly' && months && months.length > 0 && year) {
        // Logika untuk multi-pilih bulan
        whereClause.OR = months.map(m => ({
            created_at: {
                gte: new Date(parseInt(year), m - 1, 1),
                lte: new Date(parseInt(year), m, 0)
            }
        }));
    }

    // Logika Kategori Laporan (Semua, Pesanan, Pendapatan, Menu)
    switch (reportCategory) {
        case 'menu':
            // Agregasi order_items (Laporan Menu)
            const menuReport = await prisma.order_items.groupBy({
                by: ['menu_id'],
                where: { order: whereClause },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                skip,
                take: limit
            });
            return { data: menuReport, meta: { page, limit } };

        case 'revenue':
            // Laporan Pendapatan
            const revenueReport = await prisma.orders.findMany({
                where: whereClause,
                select: { id: true, grand_total_amount: true, created_at: true },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            });
            return { data: revenueReport, meta: { page, limit } };

        case 'orders':
            // Laporan Total Pesanan
            const ordersReport = await prisma.orders.findMany({
                where: whereClause,
                select: { id: true, status: true, created_at: true },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            });
            return { data: ordersReport, meta: { page, limit } };

        default:
            // Semua Laporan
            const allReport = await prisma.orders.findMany({
                where: whereClause,
                include: { order_items: true },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            });
            return { data: allReport, meta: { page, limit } };
    }
};