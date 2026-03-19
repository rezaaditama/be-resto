import { Request, Response } from "express";
import prisma from "../../lib/prisma"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { loginSchema } from "../../schemas/auth.schemas";

export const loginStaff = async (req: Request, res: Response) => {
    try {
        // validate input zod
        const validation = loginSchema.safeParse(req.body);

        // if validation failed
        if (!validation.success) {
            return res.status(400).json({
                message: "Username atau password wajib diisi",
                error: validation.error.flatten().fieldErrors
            })
        }

        // Get request from body
        const {username, password} = validation.data;

        // check username
        const user = await prisma.staff.findUnique({
            where: { username }
        });

        // validate username and password
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({
                message: "Username atau password salah"
            })
        }

        // Create JWT token if login success
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET as string,
            {expiresIn: "1d"}
        )

        // Response login success
        res.json({
            message: "Login berhasil",
            token,
            data: {
                id: user.id,
                fullname: user.fullname,
                role: user.role
            }
        })
    } catch (error) {
        // Response server error
        res.status(500).json({message: "Terjadi kesalahan pada server", error});
    }
};