import prisma from "../../lib/prisma"
import { AppError } from "../../utils/appError";
import { UpdateProfileInput } from "./profile.schemas";
import bcrypt from "bcrypt";

export const completeCustomerProfileService = async (customerId: string, data: UpdateProfileInput) => {
    
    const customer = await prisma.customers.findUnique({
        where: { id: customerId }
    });

    if (!customer) throw new AppError("Customer tidak ditemukan", 404);

    const updatePayload: any = {};

    if (data.gender) updatePayload.gender = data.gender;
    if (data.date_of_birth) updatePayload.date_of_birth = new Date(data.date_of_birth);
    if (data.fullname) updatePayload.fullname = data.fullname;
    if (data.phone_number) updatePayload.phone_number = data.phone_number;

    const updatedCustomer = await prisma.customers.update({
        where: { id: customerId },
        data: updatePayload
    });

    return updatedCustomer;
};

export const updateCustomerPasswordService = async (customerId: string, data: any) => {
    const customer = await prisma.customers.findUnique({
        where: { id: customerId }
    });

    if (!customer) throw new AppError("Customer tidak ditemukan", 404);

    // Lapis 1: Cek apakah kata sandi baru dan konfirmasi sama
    if (data.new_password !== data.confirm_password) {
        throw new AppError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru", 400);
    }

    // Lapis 2: Verifikasi kata sandi lama (Keamanan ekstra)
    const isOldPasswordCorrect = await bcrypt.compare(data.old_password, customer.password);
    if (!isOldPasswordCorrect) {
        throw new AppError("Kata sandi lama yang Anda masukkan salah", 401);
    }

    // Eksekusi update
    const hashedPassword = await bcrypt.hash(data.new_password, 10);
    await prisma.customers.update({
        where: { id: customerId },
        data: { password: hashedPassword }
    });

    return { message: "Kata sandi berhasil diperbarui dengan aman" };
};

// Tambah Alamat Baru
export const addCustomerAddressService = async (customerId: string, data: any) => {
    
    // Jika alamat baru ini diset sebagai alamat utama, matikan alamat utama yang lama
    if (data.is_core_address === true) {
        await prisma.address.updateMany({
            where: { customer_id: customerId },
            data: { is_core_address: false }
        });
    }

    // Buat alamat baru
    const newAddress = await prisma.address.create({
        data: {
            customer_id: customerId,
            address_name: data.address_name,
            latitude: data.latitude,
            longitude: data.longitude,
            mark_as: data.mark_as,
            is_core_address: data.is_core_address || false
        }
    });

    return newAddress;
};

// Update Alamat Lama
export const updateCustomerAddressService = async (customerId: string, addressId: string, data: any) => {
    
    // Pastikan alamat tersebut benar-benar milik customer yang sedang login
    const existingAddress = await prisma.address.findFirst({
        where: { id: addressId, customer_id: customerId }
    });

    if (!existingAddress) throw new AppError("Alamat tidak ditemukan atau Anda tidak memiliki akses", 404);

    // Jika alamat ini diubah menjadi alamat utama, matikan yang lain
    if (data.is_core_address === true) {
        await prisma.address.updateMany({
            where: { customer_id: customerId },
            data: { is_core_address: false }
        });
    }

    // Update alamat spesifik
    const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: {
            address_name: data.address_name,
            latitude: data.latitude,
            longitude: data.longitude,
            mark_as: data.mark_as,
            is_core_address: data.is_core_address
        }
    });

    return updatedAddress;
};

// Hapus Alamat
export const deleteCustomerAddressService = async (customerId: string, addressId: string) => {
    
    // Kita gunakan $transaction agar jika satu proses gagal, semua dibatalkan (aman)
    return await prisma.$transaction(async (tx) => {
        
        // 1. Cari alamat yang mau dihapus untuk mengecek statusnya
        const addressToDelete = await tx.address.findFirst({
            where: { id: addressId, customer_id: customerId }
        });

        if (!addressToDelete) {
            throw new AppError("Alamat tidak ditemukan", 404);
        }

        // 2. Eksekusi Hapus Alamat
        await tx.address.delete({
            where: { id: addressId }
        });

        // 3. LOGIKA AUTO-FALLBACK
        // Jika yang dihapus ternyata adalah alamat utama, kita harus mencari penggantinya
        if (addressToDelete.is_core_address === true) {
            
            // Cari 1 alamat lain yang masih tersisa milik customer ini
            const fallbackAddress = await tx.address.findFirst({
                where: { customer_id: customerId },
                orderBy: { address_name: 'asc' } // Bisa diurutkan bebas, misal berdasarkan nama atau created_at
            });

            // Jika masih ada sisa alamat lain, otomatis jadikan alamat utama
            if (fallbackAddress) {
                await tx.address.update({
                    where: { id: fallbackAddress.id },
                    data: { is_core_address: true }
                });
            }
            // (Jika fallbackAddress tidak ada / undefined, berarti alamatnya memang sudah habis / kosong. 
            // Kita tidak perlu melakukan apa-apa).
        }

        return { message: "Alamat berhasil dihapus" };
    });
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
            id: true,
            customer_id: true,
            address_name: true,
            latitude: true,
            longitude: true,
            mark_as: true,
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