import prisma from "../../lib/prisma";
import { RegisterStaffInput } from "../../schemas/admin.schemas";
import { AppError } from "../../utils/appError";
import bcrypt from "bcrypt";

// Register staff service
export const registerStaffService = async (data: RegisterStaffInput) => {
    
    const normalizedEmail = data.email.toLowerCase();
    // Check email already exist in staff table
    const existingStaffEmail = await prisma.staff.findUnique({
        where: {email: normalizedEmail}
    });

    // Check email already exist in customer table
    const existingCustomerEmail = await prisma.customers.findUnique({
        where: {email: normalizedEmail}
    });

    if (existingStaffEmail || existingCustomerEmail) {
        throw new AppError("Email sudah terdaftar", 409);
    };

    // Hashed password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create staff account
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

    // Return message and user data
    return {
        message: "Registrasi akun staff berhasil",
        id: newStaff.id,
        fullName: newStaff.fullname,
        role: newStaff.role
    };
};

// Get all customers service (Khusus Admin)
export const getAllCustomersService = async () => {
    // Ambil semua data customer beserta alamat utamanya
    const customers = await prisma.customers.findMany({
        orderBy: {
            created_at: 'desc' // Yang baru daftar muncul di paling atas
        },
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            gender: true,
            date_of_birth: true,
            is_validated: true, 
            created_at: true,
            // Tambahan: Tarik relasi tabel address
            address: {
                where: {
                    is_core_address: true // Hanya ambil alamat utama agar rapi
                },
                select: {
                    address_name: true
                },
                take: 1 // Pastikan hanya 1 data yang ditarik
            }
        }
    });

    // Formatting data agar lebih ramah untuk Frontend
    const formattedCustomers = customers.map(customer => {
        // Ekstrak nama alamat dari array yang dikembalikan Prisma
        const primaryAddressName = customer.address.length > 0 
            ? customer.address[0].address_name 
            : "Belum mengatur alamat";

        // Buang properti 'address' (array) bawaan Prisma dan ganti dengan string biasa
        const { address, ...customerDataWithoutAddressArray } = customer;

        return {
            ...customerDataWithoutAddressArray,
            address_name: primaryAddressName // Data langsung berupa string
        };
    });

    return formattedCustomers;
};

// Get all staff service (Khusus Admin)
export const getAllStaffService = async () => {
    // Ambil semua data staff tanpa filter ID
    const allStaff = await prisma.staff.findMany({
        orderBy: {
            created_at: 'desc' // Staff yang baru gabung muncul di paling atas
        },
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            gender: true,
            role: true,        // Menampilkan divisi (CASHIER, KITCHEN, WAITER, dll)
            is_active: true,   // Mengetahui apakah staff aktif atau sudah dinonaktifkan
            created_at: true
        }
    });

    return allStaff;
};

// Get detail staff service (Khusus Admin)
export const getDetailStaffService = async (staffId: string) => {
    
    // Ambil data spesifik staff berdasarkan ID
    const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            gender: true,
            role: true,
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

// Update password staff service (Reset oleh Admin / Tanpa Kata Sandi Lama)
export const updateStaffPasswordService = async (staffId: string, data: any) => { 
    // Catatan: Ganti 'any' dengan tipe data schema Zod (hanya berisi new_password dan confirm_password)

    // 1. Pastikan staff ada
    const staff = await prisma.staff.findUnique({
        where: { id: staffId }
    });

    if (!staff) {
        throw new AppError("Data staff tidak ditemukan", 404);
    }

    // 2. Validasi Konfirmasi Kata Sandi
    if (data.new_password !== data.confirm_password) {
        throw new AppError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru", 400);
    }

    // 3. Lakukan Hashing pada kata sandi baru
    const hashedPassword = await bcrypt.hash(data.new_password, 10);

    // 4. Eksekusi update hanya pada kolom password
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