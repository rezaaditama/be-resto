import prisma from "../../lib/prisma"
import { env } from "../../config/env";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/appError";
import { UpdateProfileInput } from "../../schemas/profile.schemas";

export const completeCustomerProfileService = async (customerId: string, data: UpdateProfileInput) => {
    
    // memastikan customer ada
    const customer = await prisma.customers.findUnique({
        where: { id: customerId }
    });

    if (!customer) {
        throw new AppError("Customer tidak ditemukan", 404);
    }

    // menyiapkan payload update untuk tabel customer
    const updatePayload: any = {};

    if (data.gender) updatePayload.gender = data.gender;
    if (data.date_of_birth) updatePayload.date_of_birth = new Date(data.date_of_birth);
    if (data.fullname) updatePayload.fullname = data.fullname;
    if (data.phone_number) updatePayload.phone_number = data.phone_number;
    

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