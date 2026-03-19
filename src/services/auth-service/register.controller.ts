import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../../lib/prisma";
import { registerSchema } from "../../schemas/auth.schemas";

export const registerStaff = async (req: Request, res: Response) => {
    try {

        // validate input zod
        const validation = registerSchema.safeParse(req.body)

        // if validation failed
        if (!validation.success) {
            return res.status(400).json({
                message: "Validasi gagal",
                errors: validation.error.flatten().fieldErrors
            });
        }

        // Get data from validation
        const {email, username, password, fullname, date_of_birth, role} = validation.data;

       // Check if username or email already exists
        const existingUser = await prisma.staff.findFirst({
            where: {
                OR: [{email}, {username}]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Username atau email sudah terdaftar"
            })
        }

        // Hashing by bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new staff 
        const newStaff = await prisma.staff.create({
            data: {
                email,
                username,
                password: hashedPassword,
                fullname,
                date_of_birth: new Date(date_of_birth),
                role: role.toUpperCase() as any
            }
        });

        // Response success
        res.status(201).json({
            message: "Akun staff berhasil dibuat",
            data: {
                username: newStaff.username, role: newStaff.role
            }
        }) 

    } catch (error: any) {
        // Response server error
        res.status(500).json({
            message: "Terjadi kesalahan pada server", error: error.message
        });
    }
}