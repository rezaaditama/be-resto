import { env } from "../config/env";
import nodemailer from "nodemailer"

// create transporter for send email
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: false,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    }
})

// send OTP code by email verifiy akun & forgot password
export const sendOtpEmail = async (
    email: string, 
    fullname: string, 
    otp: number, 
    type: "VERIFY" | "FORGOT_PASSWORD" = "VERIFY" // default-nya VERIFY
) => {
    // Tentukan konten berdasarkan tipe
    const isForgot = type === "FORGOT_PASSWORD";
    
    const subject = isForgot 
        ? 'Reset Kata Sandi - Kode OTP IT\'S Resto' 
        : 'Verifikasi Akun - Kode OTP IT\'S Resto';
        
    const title = isForgot 
        ? 'Kode OTP Reset Kata Sandi' 
        : 'Kode OTP Verifikasi Akun';
        
    const message = isForgot 
        ? 'Kami menerima permintaan untuk mereset kata sandi Anda. Silakan gunakan kode OTP di bawah ini:' 
        : 'Terima kasih telah mendaftar di IT\'S Resto. Silakan gunakan kode OTP di bawah ini untuk verifikasi akun Anda:';

    const mailOptions = {
        from: `"ITS Resto" <${env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50;">${title}</h2>
                <p style="font-size: 16px; color: #34495e;">Halo ${fullname},</p>
                <p style="font-size: 16px; color: #34495e;">${message}</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center;">
                    <span style="font-size: 32px; font-weight: bold; color: #2980b9;">${otp}</span>
                </div>
                
                <p style="font-size: 16px; color: #34495e;">Kode ini akan berlaku selama <strong>${isForgot ? '10 menit' : '5 menit'}</strong>.</p>
                
                <p style="font-size: 16px; color: #34495e;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>
                
                <p style="font-size: 16px; color: #34495e;">Terima kasih,<br><strong>IT'S Resto</strong></p>
            </div>
        `,
    }

    return await transporter.sendMail(mailOptions);
}