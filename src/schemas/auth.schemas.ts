import { z } from "zod";

// type for login schema
export const loginSchema = z.object({
    email: z.string().trim().email("Format E-mail tidak valid"),
    password: z.string().min(1, "Password harus diisi"),
})

// type for register schema
export const registerCustomerSchema = z.object({
    email: z.string().trim().email("Format E-mail tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter").regex(/[a-zA-Z]/, "Password harus mengandung setidaknya satu huruf")
        .regex(/[0-9]/, "Password harus mengandung setidaknya satu angka"),
    fullname: z.string().min(1, "Nama lengkap harus diisi"),
    phone_number: z.string().min(1, "Nomor telepon harus diisi").regex(/^[0-9]+$/, "Nomor telepon harus terdiri dari angka")
})

// type for OTP schemas
export const verifyOtpSchema = z.object({
    email: z.string().trim().email("Format email tidak valid"),
    otpCode: z.number().min(100000, "Kode OTP harus berisi 6 digit").max(999999, "Kode OTP harus berisi 6 digit")
})

// Export type for verify OTP schema
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
// Export type for register schema
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>
// export type for login schema
export type LoginInput = z.infer<typeof loginSchema>;