import prisma from "../../lib/prisma";
import { RegisterStaffInput } from "../../schemas/admin.schemas";
import { AppError } from "../../utils/appError";
import bcrypt from "bcrypt";

// MANAJEMEN STAFF & CUSTOMER
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

// DASHBOARD & LAPORAN SERVICE 
export const getDashboardStats = async (startDate?: string, endDate?: string) => {
    const now = new Date();

    // ==========================================
    // 1. FIX: Normalisasi Jam pada Rentang Waktu
    // ==========================================
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0); // Mulai dari jam 00:00:00

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999); // Berakhir di jam 23:59:59

    // ==========================================
    // 2. Ambil Semua Pesanan Aktif
    // ==========================================
    const orders = await prisma.orders.findMany({
        where: { 
            created_at: { gte: start, lte: end },
            status: { not: 'CANCELED' } // Pesanan batal tidak dihitung sebagai total order
        },
        select: { created_at: true, grand_total_amount: true, status: true }
    });

    // ==========================================
    // 3. FIX: Buat Grouping Data Harian untuk Grafik
    // ==========================================
    const chartDataMap: Record<string, { label: string, total_orders: number, total_revenue: number }> = {};
    let totalRevenue = 0;
    let totalOrders = orders.length;

    orders.forEach(order => {
        // Gunakan getLocal untuk menghindari bug timezone UTC vs WIB
        const year = order.created_at.getFullYear();
        const month = String(order.created_at.getMonth() + 1).padStart(2, '0');
        const day = String(order.created_at.getDate()).padStart(2, '0');
        
        const dateKey = `${year}-${month}-${day}`; // Kunci urutan: YYYY-MM-DD
        const dayLabel = day; // Label untuk sumbu X di Frontend: "10", "11", dst

        if (!chartDataMap[dateKey]) {
            chartDataMap[dateKey] = { label: dayLabel, total_orders: 0, total_revenue: 0 };
        }

        // Tambah count pesanan harian
        chartDataMap[dateKey].total_orders += 1;

        // FIX: Hanya jumlahkan pendapatan jika status pesanan COMPLETED
        if (order.status === 'COMPLETED') {
            const amount = Number(order.grand_total_amount);
            chartDataMap[dateKey].total_revenue += amount;
            totalRevenue += amount; // Tambah ke summary master
        }
    });

    // Ubah Object Map menjadi Array dan urutkan berdasarkan tanggal
    const chartData = Object.keys(chartDataMap)
        .sort()
        .map(dateKey => chartDataMap[dateKey]);

    // ==========================================
    // 4. FIX: Top 5 Menu Sering Dipesan
    // ==========================================
    const topMenusAgg = await prisma.order_items.groupBy({
        by: ['menu_id'],
        where: { 
            order: { 
                created_at: { gte: start, lte: end },
                status: 'COMPLETED' // Hanya menu dari pesanan sukses yang masuk Top 5
            } 
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
    });

    const menuDetails = await prisma.menus.findMany({
        where: { id: { in: topMenusAgg.map(m => m.menu_id!).filter(Boolean) } },
        select: { id: true, name: true, price: true, category: true, image_path: true } // <--- FIX: Tambahkan image_path
    });

    const topMenus = topMenusAgg.map((agg, index) => {
        const detail = menuDetails.find(m => m.id === agg.menu_id);
        
        // Bentuk URL gambar agar bisa langsung dibaca elemen <img> Frontend
        // Sesuaikan "/uploads/menus/" jika rute statis express kamu berbeda
        const imageUrl = detail?.image_path ? `/uploads/menus/${detail.image_path}` : null;

        return {
            rank: index + 1, // Berikan nomor urut untuk tabel Frontend
            menu_id: agg.menu_id,
            name: detail?.name,
            price: detail?.price ? Number(detail.price) : 0,
            category: detail?.category,
            image_url: imageUrl, // <--- Data gambar sudah siap pakai
            total_sold: agg._sum.quantity || 0
        };
    });

    // ==========================================
    // 5. Kembalikan Response Terstruktur
    // ==========================================
    return {
        summary: {
            totalOrders,
            totalRevenue
        },
        chartData, // Array ini yang dipakai Frontend untuk menggambar 2 grafik
        topMenus
    };
};

const namaBulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const getReportService = async (type: string, reportCategory: string, startDate?: string, endDate?: string, months?: number[], year?: string, month?: number, page: number = 1, limit: number = 10) => {
    
    let whereClause: any = {};
    const skip = (page - 1) * limit;
    
    // =====================================
    // FIX 1: Perbaikan Jam Batas Tanggal (Timezone Safe)
    // =====================================
    if (type === 'daily' && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Pastikan mengambil pesanan sampai penghujung hari
        
        whereClause.created_at = { gte: start, lte: end };
    } 
    else if (type === 'weekly' && month && year) {
        whereClause.created_at = { 
            gte: new Date(parseInt(year), month - 1, 1), 
            lte: new Date(parseInt(year), month, 0, 23, 59, 59) 
        };
    } 
    else if (type === 'monthly' && months && months.length > 0 && year) {
        whereClause.OR = months.map(m => ({
            created_at: { 
                gte: new Date(parseInt(year), m - 1, 1), 
                lte: new Date(parseInt(year), m, 0, 23, 59, 59) 
            }
        }));
    }

    const getGroupKey = (date: Date, reportType: string): string => {
        if (reportType === 'monthly') {
            return namaBulanIndo[date.getMonth()];
        } else if (reportType === 'weekly') {
            const day = date.getDate();
            if (day <= 7) return "Minggu 1";
            if (day <= 14) return "Minggu 2";
            if (day <= 21) return "Minggu 3";
            if (day <= 28) return "Minggu 4";
            return "Minggu 5";
        } else {
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        }
    };

    switch (reportCategory) {
        
        case 'orders': {
            const rawOrders = await prisma.orders.findMany({
                where: whereClause,
                select: { status: true, created_at: true }
            });

            const groupedOrders: Record<string, any> = {};

            rawOrders.forEach(order => {
                const key = getGroupKey(order.created_at, type);
                
                if (!groupedOrders[key]) {
                    groupedOrders[key] = { label: key, total_pesanan: 0, pesanan_selesai: 0, pesanan_cancel: 0 };
                }
                
                groupedOrders[key].total_pesanan++;
                // Mengakomodasi COMPLETED
                if ((order.status as string) === 'COMPLETED') {
                    groupedOrders[key].pesanan_selesai++;
                }
                // FIX 2: Typo CANCELLED (L-nya dua) diubah menjadi CANCELED (L-nya satu) sesuai enum database
                if ((order.status as string) === 'CANCELED') {
                    groupedOrders[key].pesanan_cancel++;
                }
            });

            const finalOrdersData = Object.values(groupedOrders);
            const summaryOrders = finalOrdersData.reduce((acc, curr) => {
                acc.total_semua += curr.total_pesanan;
                acc.total_selesai += curr.pesanan_selesai;
                acc.total_cancel += curr.pesanan_cancel;
                return acc;
            }, { total_semua: 0, total_selesai: 0, total_cancel: 0 });

            return { data: finalOrdersData, summary: summaryOrders };
        }

        case 'revenue': {
            // FIX 3: Tambahkan status: 'COMPLETED' pada where clause agar hanya menghitung uang yang valid
            const rawRevenue = await prisma.orders.findMany({
                where: { ...whereClause, status: 'COMPLETED' },
                select: { grand_total_amount: true, created_at: true }
            });

            const groupedRevenue: Record<string, any> = {};

            rawRevenue.forEach(order => {
                const key = getGroupKey(order.created_at, type);
                
                if (!groupedRevenue[key]) {
                    groupedRevenue[key] = { label: key, total_pesanan: 0, total_pendapatan: 0 };
                }
                
                groupedRevenue[key].total_pesanan++;
                groupedRevenue[key].total_pendapatan += Number(order.grand_total_amount || 0);
            });

            const finalRevenueData = Object.values(groupedRevenue);
            const summaryRevenue = finalRevenueData.reduce((acc, curr) => {
                acc.total_semua_pesanan += curr.total_pesanan;
                acc.grand_total_pendapatan += curr.total_pendapatan;
                return acc;
            }, { total_semua_pesanan: 0, grand_total_pendapatan: 0 });

            return { data: finalRevenueData, summary: summaryRevenue };
        }

        case 'menu': {
            // FIX 4: Filter hanya pesanan COMPLETED, lalu tarik nama, harga, kategori dari tabel Menu
            const menuReportAgg = await prisma.order_items.groupBy({
                by: ['menu_id'],
                where: { order: { ...whereClause, status: 'COMPLETED' } }, 
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                skip, take: limit
            });

            // Tarik detail menu berdasarkan ID yang didapat dari grouping
            const menuDetails = await prisma.menus.findMany({
                where: { id: { in: menuReportAgg.map(m => m.menu_id!).filter(Boolean) } },
                select: { id: true, name: true, price: true, category: true }
            });

            // Format data agar persis dengan kolom tabel di Frontend
            const finalMenuData = menuReportAgg.map((agg, index) => {
                const detail = menuDetails.find(m => m.id === agg.menu_id);
                return {
                    no: skip + index + 1, // Penomoran tabel otomatis
                    nama_menu: detail?.name || "Menu Dihapus",
                    harga: detail?.price ? Number(detail.price) : 0,
                    kategori: detail?.category || "-",
                    total: agg._sum.quantity || 0
                };
            });

            return { data: finalMenuData, meta: { page, limit } };
        }

        default: {
            const allReport = await prisma.orders.findMany({
                where: whereClause,
                include: { order_items: true },
                orderBy: { created_at: 'desc' },
                skip, take: limit
            });
            return { data: allReport, meta: { page, limit } };
        }
    }
};