import { LoginInput, RegisterCustomerInput, RegisterStaffInput, ResetPasswordInput, VerifyOtpInput, VerifyResetOtpInput } from "../../schemas/auth.schemas";
import prisma from "../../lib/prisma"
import bcrypt from "bcrypt";
import { env } from "../../config/env";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../../utils/sendEmail";
import { AppError } from "../../utils/appError";
import { nonoptional } from "zod";

// Login user service
export const loginUserService = async (data: LoginInput) => {

    // search user in staff table
    let user: any = await prisma.staff.findUnique({
        where: {
            email: data.email
        }
    });

    // create user type
    let userType: "STAFF" | "CUSTOMER" = "STAFF";

    // if user not exits in staff table, search in customer table
    if (!user) {
        user = await prisma.customers.findUnique({
            where: {email: data.email}
        });
        userType = "CUSTOMER";
    };

    // if user not exits or incorrect password
    if (!user || !await bcrypt.compare(data.password, user.password)) {
        throw new AppError("Email atau kata sandi yang anda masukkan salah", 401);
    };

    // check active status account
    const activeStatus = userType === "STAFF" ? user.is_active : user.is_validated;

    // if account user inactive
    if (!activeStatus) {
        throw new AppError(
            userType === "STAFF" ? "Akun anda nonaktif, segera hubungi admin" : "Akun anda belum terverifikasi, segera verifikasi akun anda",
            403
        )
    };

    // generate JWT token
    const token = jwt.sign({
        id: user.id,
        role: user.role || "CUSTOMER",
    }, env.JWT_SECRET, {
        expiresIn: "1d"
    });

    // return token and user data
    return {token, user: {id: user.id, fullName: user.fullname, role: user.role || "CUSTOMER"}};
};

// Register customer service
export const registerCustomerService = async (data: RegisterCustomerInput) => {
    
    const normalizedEmail = data.email.toLowerCase();

    // check email if already exist in customer table
    const existingCustomerEmail = await prisma.customers.findUnique({
        where: {email: normalizedEmail}
    });

    // check email if already exist in staff table
    const existingStaffEmail = await prisma.staff.findUnique({
        where: {email: normalizedEmail}
    });

    // if email already exist
    if (existingCustomerEmail || existingStaffEmail) {
        throw new AppError("Email sudah terdaftar", 409);
    };

    // hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate otp code
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // generate otp expired_at
    const otpExpiredAt = new Date(Date.now() + 2 * 60 * 1000);

    // Create customer
    const newCustomer = await prisma.customers.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword,
            fullname: data.fullname,
            phone_number: data.phone_number,
            otp_code: otpCode,
            is_validated: false,
            otp_expired_at: otpExpiredAt
        },
    });

    // send code otp by email
    try {
        await sendOtpEmail(newCustomer.email, newCustomer.fullname, otpCode);
    } catch (error) {
        console.error("Gagal mengirim kode OTP", error)
    }

    // return message and email
    return ( {
        message: "Registrasi berhasil, silahkan verifikasi akun anda",
        email: newCustomer.email
    } )
};

// Verify OTP service
export const verifyCodeOtpService = async (data: VerifyOtpInput) => {

    const normalizedEmail = data.email.toLowerCase();
    // search user in customer table
    const user = await prisma.customers.findUnique({
        where: {email: normalizedEmail}
    });

    // if user not found
    if (!user) {
        throw new AppError("User tidak ditemukan", 404);
    };

    // if otp code expired
    if (user.otp_expired_at && new Date() > user.otp_expired_at) {
        throw new AppError("Kode OTP yang anda masukkan sudah kadaluarsa, silahkan minta kode OTP baru", 400);
    };

    // if otp code not match
    if (user.otp_code !== data.otpCode) {
        throw new AppError("Kode OTP yang anda masukkan salah. Silahkan coba lagi.", 400);
    }

    // update customer data
    await prisma.customers.update({
        where: {email: normalizedEmail},
        data: {
            is_validated: true,
            otp_code: null,
            otp_validated_at: new Date(),
            otp_expired_at: null
        }
    });

    // return message
    return {
        message: "Verifikasi berhasil, akun anda sudah aktif"
    };
}

// kirim ulang otp service
export const resendOtpService = async (data: { email: string }) => {

    const normalizedEmail = data.email.toLowerCase();
    // 1. Cari user di tabel customer
    const user = await prisma.customers.findUnique({
        where: { email: normalizedEmail }
    });

    if (!user) {
        throw new AppError("User tidak ditemukan", 404);
    }

    // 2. Jika sudah diverifikasi, tidak perlu kirim OTP lagi
    if (user.is_validated) {
        throw new AppError("Akun ini sudah terverifikasi, silakan login", 400);
    }

    // membatasi waktu pengiriman otp ulang selama 1 menit
    if (user.otp_expired_at) {
        // Hitung kapan OTP terakhir dibuat (asumsi expired 2 menit, maka dibuat 2 menit sebelum expired)
        const lastSent = new Date(user.otp_expired_at.getTime() - 2 * 60 * 1000);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - lastSent.getTime()) / 1000);

        if (diffInSeconds < 60) {
            const waitTime = 60 - diffInSeconds;
            throw new AppError(`Tunggu ${waitTime} detik lagi untuk mengirim ulang OTP`, 429);
        }
    }

    // 3. Generate OTP baru (6 digit)
    const newOtpCode = Math.floor(100000 + Math.random() * 900000);
    const newOtpExpiredAt = new Date(Date.now() + 2 * 60 * 1000); // 5 menit

    // 4. Update di database
    await prisma.customers.update({
        where: { email: normalizedEmail },
        data: {
            otp_code: newOtpCode,
            otp_expired_at: newOtpExpiredAt
        }
    });

    // 5. Kirim ulang email
    try {
        await sendOtpEmail(user.email, user.fullname, newOtpCode);
    } catch (error) {
        console.error("Gagal mengirim ulang kode OTP", error);
        throw new AppError("Gagal mengirim email, silakan coba lagi nanti", 500);
    }

    return { message: "Kode OTP baru telah dikirim ke email anda, silahkan cek kembali email anda" };
};

// Register staff service
export const registerStaffService = async (data: RegisterStaffInput) => {
    
    const normalizedEmail = data.email.toLowerCase();
    // Check email already exist in staff table
    const existingStaffEmail = await prisma.staff.findUnique({
        where: {email: normalizedEmail}
    });

    // Check email already exist in customer table
    const existingCustomerEmail = await prisma.customers.findUnique({
        where: {email: normalizedEmail}
    });

    if (existingStaffEmail || existingCustomerEmail) {
        throw new AppError("Email sudah terdaftar", 409);
    };

    // Hashed password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create staff account
    const newStaff = await prisma.staff.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword,
            fullname: data.fullname,
            role: data.role,
            gender: data.gender,
            phone_number: data.phone_number,
            is_active: true
        }
    });

    // Return message and user data
    return {
        message: "Registrasi akun staff berhasil",
        id: newStaff.id,
        fullName: newStaff.fullname,
        role: newStaff.role
    };
};

// logout service
export const logoutUserService = async (userId: string, role: string) => {
    console.log(`User ${role} dengan ID ${userId} melakukan logout.`);
    
    return { message: "Logout berhasil" };
};

export const forgotPasswordService = async (data: { email: string }) => {

    const normalizedEmail = data.email.toLowerCase();

    // Cari di staff, jika tidak ada cari di customer
    let user: any = await prisma.staff.findUnique({ where: { email: normalizedEmail } });
    let userType: "staff" | "customers" = "staff";

    if (!user) {
        user = await prisma.customers.findUnique({ where: { email: normalizedEmail } });
        userType = "customers";
    }

    if (!user) throw new AppError("Email tidak terdaftar", 404);

    // Buat OTP baru
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    const otpExpiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // Update tabel yang sesuai
    await (prisma[userType] as any).update({
        where: { email: normalizedEmail },
        data: { otp_code: otpCode, otp_expired_at: otpExpiredAt }
    });

    // Kirim email
    await sendOtpEmail(user.email, user.fullname, otpCode, "FORGOT_PASSWORD");
    return { message: "Kode OTP untuk reset password telah dikirim ke email anda" };
};

// Verifikasi OTP dan berikan Token Sementara
export const verifyResetOtpService = async (data: VerifyResetOtpInput) => {

    const normalizedEmail = data.email.toLowerCase();

    let user: any = await prisma.staff.findUnique({ where: { email: normalizedEmail } });
    if (!user) user = await prisma.customers.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.otp_code !== data.otpCode) throw new AppError("Kode OTP salah", 400);
    if (user.otp_expired_at && new Date() > user.otp_expired_at) throw new AppError("OTP Kadaluarsa", 400);

    // Buat token sementara yang berlaku 15 menit saja
    const resetToken = jwt.sign(
        { id: user.id, email: user.email, purpose: "reset_password" },
       env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    return { resetToken };
};

// Eksekusi Resend Otp Forgot Password
export const resendForgotPasswordOtpService = async (data: { email: string }) => {
    // Normalisasi email
    const normalizedEmail = data.email.toLowerCase();

    // 1. Cari user di tabel customer
    const user = await prisma.customers.findUnique({ 
        where: { email: normalizedEmail } 
    });

    if (!user) {
        throw new AppError("Email tidak terdaftar", 404);
    }

    // 2. Mencegah Spam: Batasi pengiriman OTP ulang selama 1 menit (60 detik)
    if (user.otp_expired_at) {
        // Hitung kapan OTP terakhir dibuat
        // Karena forgot password masa berlakunya 10 menit, kita kurangi 10 menit
        const lastSent = new Date(user.otp_expired_at.getTime() - 10 * 60 * 1000);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - lastSent.getTime()) / 1000);

        // Jika selisih waktu belum mencapai 60 detik, tolak request
        if (diffInSeconds < 60) {
            const waitTime = 60 - diffInSeconds;
            throw new AppError(`Tunggu ${waitTime} detik lagi untuk mengirim ulang OTP`, 429); // 429 = Too Many Requests
        }
    }

    // 3. Buat OTP BARU dan set waktu kadaluarsa ke 10 menit ke depan
    const newOtpCode = Math.floor(100000 + Math.random() * 900000);
    const newOtpExpiredAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Update (timpa) OTP lama di database
    await prisma.customers.update({
        where: { email: normalizedEmail },
        data: { 
            otp_code: newOtpCode, 
            otp_expired_at: newOtpExpiredAt 
        }
    });

    // 5. Kirim ulang email-nya dengan error handling
    try {
        await sendOtpEmail(user.email, user.fullname, newOtpCode, "FORGOT_PASSWORD");
    } catch (error) {
        console.error("Gagal mengirim ulang kode OTP Forgot Password", error);
        throw new AppError("Gagal mengirim email, silakan coba lagi nanti", 500);
    }

    return { 
        success: true,
        message: "Kode OTP baru telah berhasil dikirim ulang ke email anda" 
    };
};

// Eksekusi Reset Password (Tanpa butuh email di body, ambil dari token JWT)
export const resetPasswordService = async (userId: string, data: ResetPasswordInput) => {

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update di kedua tabel (atau buat fungsi helper untuk mendeteksi tabel)
    const isStaff = await prisma.staff.findUnique({ where: { id: userId } });
    const table = isStaff ? "staff" : "customers";

    await (prisma[table] as any).update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            otp_code: null,
            otp_expired_at: null
        }
    });

    return { message: "Kata sandi berhasil diperbarui" };
};

