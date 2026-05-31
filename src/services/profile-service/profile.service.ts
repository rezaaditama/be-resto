import prisma from "../../lib/prisma"
import { AppError } from "../../utils/appError";
import { UpdateProfileInput } from "./profile.schemas";
import bcrypt from "bcrypt";

export const completeCustomerProfileService = async (customerId: string, data: UpdateProfileInput) => {
    
    // memastikan customer ada
    const customer = await prisma.customers.findUnique({
        where: { id: customerId }
    });

    if (!customer) {
        throw new AppError("Customer tidak ditemukan", 404);
    }

    // ─── TAMBAHAN LOGIKA PENANGANAN BUG (CORE ADDRESS) ───────────────
    if (data.addresses && data.addresses.length > 0) {
        // Hitung berapa banyak alamat di payload yang diset true
        const coreAddressesCount = data.addresses.filter(addr => addr.is_core_address === true).length;
        
        // 1. Validasi: Jangan izinkan payload memiliki lebih dari satu core address
        if (coreAddressesCount > 1) {
            throw new AppError("Hanya boleh memilih satu alamat utama (core address)", 400);
        }

        // 2. Reset Database: Jika request ini membawa 1 alamat utama baru, 
        // pastikan semua alamat lama milik customer ini di database dijadikan false terlebih dahulu.
        if (coreAddressesCount === 1) {
            await prisma.address.updateMany({ // Sesuaikan 'address' dengan nama model tabel alamat di Prisma-mu
                where: { customer_id: customerId },
                data: { is_core_address: false }
            });
        }
    }

    // menyiapkan payload update untuk tabel customer
    const updatePayload: any = {};

    if (data.gender) updatePayload.gender = data.gender;
    if (data.date_of_birth) updatePayload.date_of_birth = new Date(data.date_of_birth);
    if (data.fullname) updatePayload.fullname = data.fullname;
    if (data.phone_number) updatePayload.phone_number = data.phone_number;

    // ─── TAMBAHAN LOGIKA UPDATE PASSWORD DENGAN BCRYPT ───────────────
    if (data.password) {
        // Lakukan hashing pada password baru sebelum disimpan ke database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        updatePayload.password = hashedPassword;
    }
    

    // membuat Logika Prisma Nested Writes untuk tabel address
    if (data.addresses && data.addresses.length > 0) {
        // Filter alamat yang TIDAK punya ID (berarti alamat baru)
        const addressesToCreate = data.addresses
            .filter(addr => !addr.id)
            .map(addr => ({ 
                address_name: addr.address_name,
                latitude: addr.latitude,
                longitude: addr.longitude,
                mark_as: addr.mark_as,
                is_core_address: addr.is_core_address 
            }));

        // Filter alamat yang PUNYA ID (berarti update alamat lama)
        const addressesToUpdate = data.addresses
            .filter(addr => addr.id)
            .map(addr => ({
                where: { id: addr.id },
                data: { 
                    address_name: addr.address_name,
                    latitude: addr.latitude,
                    longitude: addr.longitude,
                    mark_as: addr.mark_as,
                    is_core_address: addr.is_core_address 
                }
            }));

        // Masukkan ke payload update
        updatePayload.address = {
            ...(addressesToCreate.length > 0 && { create: addressesToCreate }),
            ...(addressesToUpdate.length > 0 && { update: addressesToUpdate })
        };
    }

    // Eksekusi ke database
    const updatedCustomer = await prisma.customers.update({
        where: { id: customerId },
        data: updatePayload,
        include: {
            address: true
        }
    });

    return updatedCustomer;
};

// Read data profile customer
export const getCustomerProfileService = async (userId: string) => {
    // Mengambil data spesifik 1 customer berdasarkan ID dari Token
    const customerProfile = await prisma.customers.findUnique({
        where: { 
            id: userId 
        },
        select: {
            email: true,
            fullname: true,
            phone_number: true,
            gender: true,
            date_of_birth: true
        }
    });

    // Jaga-jaga jika ID di token tidak ditemukan di database (misal akun dihapus)
    if (!customerProfile) {
        throw new AppError("Profil tidak ditemukan", 404);
    }

    return customerProfile;
}

// address.service.ts

export const getCustomerAddressesService = async (customerId: string) => {
    // Mengambil SEMUA alamat yang hanya dimiliki oleh customer yang sedang login
    const addresses = await prisma.address.findMany({
        where: { 
            customer_id: customerId // Pastikan nama kolom relasinya sesuai di schema.prisma kamu
        },
        select: {
            customer_id: true,
            address_name: true,
            latitude: true,
            longitude: true,
            is_core_address: true
        },
        orderBy: {
            is_core_address: 'desc' 
        }
    });

    // Format ulang data untuk menyisipkan Link Google Maps
    const formattedAddresses = addresses.map(address => {
        return {
            ...address, // Copy semua isi data aslinya (customer_id, address_name, dll)
            
            // Tambahkan properti baru hasil rakitan latitude & longitude
            gmaps_link: `https://www.google.com/maps?q=${address.latitude},${address.longitude}`
        };
    });

    // Kembalikan data yang sudah diformat ke Controller
    return formattedAddresses;
}

// Read data profile staff
export const getStaffProfileService = async (userId: string) => {
    // Mengambil data spesifik 1 staff berdasarkan ID dari Token
    const staffProfile = await prisma.staff.findUnique({
        where: { 
            id: userId 
        },
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            role: true,
            gender: true,      
            is_active: true,  // Status keaktifan staff di resto
            created_at: true
        }
    });

    // Jaga-jaga jika ID di token tidak ditemukan di database (misal staff sudah dipecat/dihapus)
    if (!staffProfile) {
        throw new AppError("Profil staff tidak ditemukan atau sudah tidak aktif", 404);
    }

    // Tambahan Keamanan: Jika staff dinonaktifkan oleh Admin, blokir aksesnya
    if (!staffProfile.is_active) {
        throw new AppError("Akun staff Anda sudah dinonaktifkan", 403);
    }

    return staffProfile;
}

// Update staff account service
export const updateStaffService = async ( targetId: string, data: { fullname?: string; phone_number?: string; role?: string; is_active?: boolean }, requestUserRole: string ) => {
    
    // 1. Cek apakah staff yang mau diupdate ada di database
    const existingStaff = await prisma.staff.findUnique({
        where: { id: targetId }
    });

    if (!existingStaff) {
        throw new AppError("Data staff tidak ditemukan", 404);
    }

    // 2. Proteksi Keamanan: Jika BUKAN admin, dilarang ubah Role dan Status Aktif
    if (requestUserRole !== "ADMIN" && requestUserRole !== "ADMIN_ROLE") {
        if (data.role || data.is_active !== undefined) {
            throw new AppError("Akses ditolak! Hanya Admin yang boleh mengubah Role atau Status Aktif staff", 403);
        }
    }

    // 3. Jalankan update ke database
    const updatedStaff = await prisma.staff.update({
        where: { id: targetId },
        data: {
            fullname: data.fullname,
            phone_number: data.phone_number,
            role: data.role as any, // 'as any' agar aman dari kendala enum Prisma saat kompilasi
            is_active: data.is_active
        },
        select: {
            id: true,
            email: true,
            fullname: true,
            phone_number: true,
            role: true,
            is_active: true,
            updated_at: true
        }
    });

    return updatedStaff;
};