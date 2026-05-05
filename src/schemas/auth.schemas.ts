import { gender_option } from "../../generated/prisma";
import { float32, z } from "zod";

// type for login schema
export const loginSchema = z.object({
    email: z.string().trim().email("Format E-mail tidak valid"),
    password: z.string().min(1, "Password harus diisi"),
})

// type for register schema ditambah confirm_password
export const registerCustomerSchema = z.object({
    email: z.string().trim().email("Format E-mail tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter").regex(/[a-zA-Z]/, "Password harus mengandung setidaknya satu huruf")
        .regex(/[0-9]/, "Password harus mengandung setidaknya satu angka"),
    confirm_password: z.string(),
    fullname: z.string().min(1, "Nama lengkap harus diisi"),
    phone_number: z.string().min(10, "Nomor telepon terlalu pendek (minimal 10 angka)").max(15, "Nomor telepon terlalu panjang (maksimal 15 angka)").regex(/^(?:\+62|62|0)8[1-9][0-9]{6,10}$/,
        "Format nomor telepon tidak valid. Gunakan format 08..., 628..., atau +628...")
}).refine((data) => data.password === data.confirm_password, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirm_password"], // Error akan muncul di field confirmPassword
});

// type for OTP schemas
export const verifyOtpSchema = z.object({
    email: z.string().trim().email("Format email tidak valid"),
    otpCode: z.number().min(100000, "Kode OTP harus berisi 6 digit").max(999999, "Kode OTP harus berisi 6 digit")
})

// kirim ulang otp schemas
export const resendOtpSchema = z.object({
    email: z.string().email("Format email tidak valid")
});

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

// Schema untuk meminta OTP (Hanya butuh email)
export const forgotPasswordSchema = z.object({
    email: z.string().email("Format email tidak valid"),
});

// Schema untuk verifikasi OTP (Email + OTP)
export const verifyResetOtpSchema = z.object({
    email: z.string().email("Format email tidak valid"),
    otpCode: z.coerce.number({ message: "OTP harus diisi" }),
});

// Schema untuk reset password baru (Hanya password & konfirmasi)
export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"], // Error akan muncul di field confirmPassword
});

// Export type for verify OTP schema
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
// export type for resenf OTP schema
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
// Export type for register schema
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>
// export type for login schema
export type LoginInput = z.infer<typeof loginSchema>;
// export type for register staff schema
export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;
// export type for forgot password schema
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
// export type for forgot password schema
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
// export type for reset password schema
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
