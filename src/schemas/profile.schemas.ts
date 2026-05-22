import { gender_option, role } from "../../generated/prisma";
import { z } from "zod";

// Schema untuk update profil & alamat
export const updateProfileSchema = z.object({
    fullname: z.string().optional(),
    phone_number: z.string().regex(/^[0-9]+$/, "Nomor telepon harus terdiri dari angka").optional(),
    gender: z.nativeEnum(gender_option, { message: "Gender tidak valid" }).optional(),
    date_of_birth: z.string().optional(), // Frontend mengirimkan YYYY-MM-DD
    addresses: z.array(
        z.object({
            id: z.string().uuid("Format ID alamat tidak valid").optional(), // Ada ID = Update, Tidak ada = Create
            address_name: z.string().min(1, "Alamat tidak boleh kosong"),
            latitude: z.number({ message: "Latitude harus berupa angka" }).optional(),
            longitude: z.number({ message: "Longitude harus berupa angka" }).optional(),
            mark_as: z.enum(["HOME", "OFFICE"], { message: "Label alamat tidak valid" }).optional(),
            is_core_address: z.boolean({ message: "Format is_core_address harus boolean" }).optional()
        })
    ).optional()
});

export const updateStaffSchema = z.object({
    fullname: z.string().max(255, "Nama terlalu panjang").optional(),
    phone_number: z.string()
        .regex(/^[0-9]+$/, "Nomor telepon harus terdiri dari angka")
        .max(15, "Nomor telepon terlalu panjang")
        .optional(),
    role: z.nativeEnum(role, {error: "Role tidak valid! Pilih antara ADMIN, CASHIER, KITCHEN, atau WAITER"}).optional(),
    is_active: z.boolean({ message: "Format is_active harus boolean" }).optional()
});

// export type for update profile schema
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;