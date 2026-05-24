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
    // Ambil semua data customer tanpa filter ID
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
            is_validated: true, // Untuk melihat apakah akunnya sudah terverifikasi
            created_at: true
        }
    });

    return customers;
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
            role: true,        // Menampilkan divisi (CASHIER, KITCHEN, WAITER, dll)
            is_active: true,   // Mengetahui apakah staff aktif atau sudah dinonaktifkan
            created_at: true
        }
    });

    return allStaff;
};