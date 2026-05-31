import { z } from "zod";

// type for gender schema
export const GenderEnum = z.enum(["MALE", "FEMALE"]);

// type for role schema
export const RoleStaffEnum = z.enum(["ADMIN", "CASHIER", "WAITER", "KIOSK_SYSTEM", "KITCHEN"]);

// type for register staff schema
export const registerStaffSchema = z.object({
    email: z.string().trim().email("Format E-mail tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter").regex(/[a-zA-Z]/, "Password harus mengandung setidaknya satu huruf")
        .regex(/[0-9]/, "Password harus mengandung setidaknya satu angka"),
    fullname: z.string().min(1, "Nama lengkap harus diisi"),
    role: RoleStaffEnum,
    gender: GenderEnum,
    phone_number: z.string().min(10, "Nomor telepon terlalu pendek (minimal 10 angka)").max(15, "Nomor telepon terlalu panjang (maksimal 15 angka)").regex(/^(?:\+62|62|0)8[1-9][0-9]{6,10}$/,
        "Format nomor telepon tidak valid. Gunakan format 08..., 628..., atau +628...")
});

// Skema untuk reset password staff oleh admin
export const updateStaffPasswordSchema = z.object({
  new_password: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
  confirm_password: z.string().min(1, "Konfirmasi kata sandi wajib diisi")
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Konfirmasi kata sandi harus sama persis dengan kata sandi baru",
  path: ["confirm_password"], 
});


// export type for register staff schema
export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;

export type UpdateStaffPasswordInput = z.infer<typeof updateStaffPasswordSchema>;