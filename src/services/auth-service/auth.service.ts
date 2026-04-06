import prisma from "../../lib/prisma";
import { LoginInput, RegisterCustomerInput, VerifyOtpInput } from "../../schemas/auth.schemas";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { sendOtpEmail } from "../../utils/sendEmail";

// Service for login user
export const loginUserService = async (data: LoginInput) => {
    
    // Search user by email
    const user = await prisma.users.findUnique(
        {where: {email: data.email}}
    );

    // if user doesn't exist
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
        const error: any = new Error("Email atau kata sandi yang anda masukkan salah");
        error.status = 401;
        throw error;
    }

    // if user is inactive
    if (!user.is_active) {
        const error: any = new Error("Akun anda inactive, segera hubungi admin");
        error.status = 403;
        throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    )

    return {token, user};
};


// service for register customer
export const registerCustomerService = async (data: RegisterCustomerInput) => {

    // check if email is already exist
    const existingEmail = await prisma.users.findUnique({
        where: {email: data.email}
    });

    // If email is already exist
    if (existingEmail) {
        const error: any = new Error("Email sudah terdaftar");
        error.status = 409;
        throw error;
    }

    // Hashing password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // Generate OTP expiration time (valid for 5 minutes)
    const otpExpiredAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save user to database
    const newUser = await prisma.users.create({
        data: {
            email: data.email,
            password: hashedPassword,
            fullname: data.fullname,
            phone_number: data.phone_number,
            role: "CUSTOMER",
            otp_code: otpCode,
            otp_expired_at: otpExpiredAt,
            is_active: false
        }
    });

    // send OTP code to user email
    try {
        await sendOtpEmail(newUser.email, newUser.fullname, otpCode)
    } catch (err) {
        console.error("Email error: ", err)
    }
    
    return {user: newUser}
};

// service for verify OTP
export const verifyOtpService = async (data: VerifyOtpInput) => {
   
    // Check user email
    const user = await prisma.users.findUnique({
        where: {email: data.email}
    });

    // If user doesn't exist
    if (!user) {
        const error:any = new Error("User tidak ditemukan");
        error.status = 404;
        throw error;
    };

    // If OTP is expired
    if (user.otp_expired_at && new Date() > user.otp_expired_at) {
        const error: any = new Error("Kode OTP sudah kadaluarsa, silahkan minta kode OTP baru");
        error.status = 400;
        throw error;
    }

    // check OTP code incorrect
    if (user.otp_code !== data.otpCode) {
        const error: any = new Error("Kode OTP salah");
        error.status = 400;
        throw error;
    }

    // update user status to active
    await prisma.users.update({
        where: {id: user.id},
        data: {
            is_active: true,
            otp_code: null,
            otp_expired_at: null,
            otp_validated_at: new Date()
        }
    });

    return {message: "Akun berhasil di verifikasi"};
}