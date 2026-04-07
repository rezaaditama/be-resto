import { LoginInput, RegisterCustomerInput, VerifyOtpInput } from "../../schemas/auth.schemas";
import prisma from "../../lib/prisma"
import bcrypt from "bcrypt";
import { env } from "../../config/env";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../../utils/sendEmail";
import { AppError } from "../../utils/appError";

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
    const activeStatus = userType === "STAFF" ? user.is_active : user.is_validate;

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
    
    // check email if already exist in customer table
    const existingCustomerEmail = await prisma.customers.findUnique({
        where: {email: data.email}
    });

    // check email if already exist in staff table
    const existingStaffEmail = await prisma.staff.findUnique({
        where: {email: data.email}
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
    const otpExpiredAt = new Date(Date.now() + 5 * 60 * 1000);

    // Create customer
    const newCustomer = await prisma.customers.create({
        data: {
            email: data.email,
            password: hashedPassword,
            fullname: data.fullname,
            phone_number: data.phone_number,
            otp_code: otpCode,
            is_validate: false,
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

    // search user in customer table
    const user = await prisma.customers.findUnique({
        where: {email: data.email}
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
        where: {email: data.email},
        data: {
            is_validate: true,
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