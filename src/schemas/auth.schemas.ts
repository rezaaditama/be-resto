import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Format E-mail tidak valid"),
    username: z.string().min(5, "Username minimal 5 karakter"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    fullname: z.string().min(1, "Nama lengkap harus diisi"),
    date_of_birth: z.string().refine((date) => !isNaN(Date.parse(date)), {message: "Format tanggal lahir tidak valid (yyyy-mm-dd)",}),
    role: z.enum(["ADMIN", "CASHIER", "WAITER", "KIOSK_SYSTEM"], {
        message: "Role harus salah satu dari ADMIN, CASHIER, WAITER, atau KIOSK_SYSTEM"
    })
});

export const loginSchema = z.object({
    username: z.string().min(1, "Username harus diisi"),
    password: z.string().min(1, "Password harus diisi"),
})