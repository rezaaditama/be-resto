import { gender_option } from "../../generated/prisma";
import { float32, z } from "zod";

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

// export type for update profile schema
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;