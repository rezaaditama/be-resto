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

// send OTP code by email
export const sendOtpEmail = async (email: string, fullname: string, otp: number) => {
    const mailOptions = {
        from: `"ITS Resto" <${env.SMTP_USER}>`,
        to: email,
        subject: 'Verifikasi akun - Kode OTP IT\'S Resto',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Kode OTP Verifikasi Akun</h2>
                <p style="font-size: 16px; color: #34495e;">Halo ${fullname},</p>
                <p style="font-size: 16px; color: #34495e;">Terima kasih telah mendaftar di IT'S Resto. Silahkan gunakan kode OTP di bawah ini untuk verifikasi akun Anda:</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center;">
                    <span style="font-size: 32px; font-weight: bold; color: #2980b9;">${otp}</span>
                </div>
                
                <p style="font-size: 16px; color: #34495e;">Kode ini akan berlaku selama <strong>5 menit</strong>.</p>
                
                <p style="font-size: 16px; color: #34495e;">Jika Anda tidak merasa mendaftar di IT'S Resto, abaikan email ini.</p>
                
                <p style="font-size: 16px; color: #34495e;">Terima kasih,<br><strong>IT'S Resto</strong></p>
            </div>
        `,
    }

    // send email
    return await transporter.sendMail(mailOptions);
}