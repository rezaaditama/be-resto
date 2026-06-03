import { gender_option, role } from "../../../generated/prisma";
import { z } from "zod";

// Schema untuk update profil & alamat
export const updateProfileSchema = z.object({
    fullname: z.string().min(1, "Nama tidak boleh kosong").optional(),
    phone_number: z.string().regex(/^[0-9]+$/, "Nomor telepon harus terdiri dari angka").optional(),
    gender: z.nativeEnum(gender_option, { message: "Gender tidak valid" }).optional(),
    date_of_birth: z.string().optional(),
});

// Skema Update Kata Sandi (Dengan validasi sandi lama & konfirmasi)
export const updateCustomerPasswordSchema = z.object({
    old_password: z.string().min(1, "Kata sandi lama wajib diisi"),
    new_password: z.string()
        .min(8, "Password minimal 8 karakter")
        .regex(/[a-zA-Z]/, "Password harus mengandung setidaknya satu huruf")
        .regex(/[0-9]/, "Password harus mengandung setidaknya satu angka"),
    confirm_password: z.string().min(1, "Konfirmasi kata sandi wajib diisi")
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Konfirmasi kata sandi harus sama persis dengan kata sandi baru",
    path: ["confirm_password"], 
});

// Skema Tambah Alamat Baru (address_name wajib diisi)
export const addCustomerAddressSchema = z.object({
    address_name: z.string().min(1, "Alamat tidak boleh kosong"),
    latitude: z.number({ message: "Latitude harus berupa angka" }).optional(),
    longitude: z.number({ message: "Longitude harus berupa angka" }).optional(),
    mark_as: z.enum(["HOME", "OFFICE"], { message: "Label alamat tidak valid" }).optional(),
    is_core_address: z.boolean({ message: "Format is_core_address harus boolean" }).optional()
});

// Skema Update Alamat Lama (Semua field opsional)
export const updateCustomerAddressSchema = z.object({
    address_name: z.string().min(1, "Alamat tidak boleh kosong").optional(),
    latitude: z.number({ message: "Latitude harus berupa angka" }).optional(),
    longitude: z.number({ message: "Longitude harus berupa angka" }).optional(),
    mark_as: z.enum(["HOME", "OFFICE"], { message: "Label alamat tidak valid" }).optional(),
    is_core_address: z.boolean({ message: "Format is_core_address harus boolean" }).optional()
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
// export type for update password customer schema
export type UpdateCustomerPasswordInput = z.infer<typeof updateCustomerPasswordSchema>;
// export type for add addreses customer schema
export type AddCustomerAddressInput = z.infer<typeof addCustomerAddressSchema>;
// export type for update addreses customer schema
export type UpdateCustomerAddressInput = z.infer<typeof updateCustomerAddressSchema>;