import { z } from "zod";

// type for register schema
export const registerSchema = z.object({
    email: z.string().trim().email("Format E-mail tidak valid"),
    username: z.string().trim().min(5, "Username minimal 5 karakter").regex(/^\S+$/, "Username tidak boleh mengandung spasi"),
    password: z.string().min(8, "Password minimal 8 karakter").regex(/^\S+$/, "Password tidak boleh mengandung spasi"),
    fullname: z.string().trim().min(1, "Nama lengkap harus diisi"),
    date_of_birth: z.string().refine((date) => !isNaN(Date.parse(date)), {message: "Format tanggal lahir tidak valid (yyyy-mm-dd)",}).transform((date) => new Date(date)),
    role: z.enum(["ADMIN", "CASHIER", "WAITER", "KIOSK_SYSTEM"], {
        message: "Role harus salah satu dari ADMIN, CASHIER, WAITER, atau KIOSK_SYSTEM"
    })
});

// export type for register schema
export type RegisterInput = z.infer<typeof registerSchema>;

// type for login schema
export const loginSchema = z.object({
    username: z.string().min(1, "Username harus diisi"),
    password: z.string().min(1, "Password harus diisi"),
})

// export type for login schema
export type LoginInput = z.infer<typeof loginSchema>;