import { RegisterInput, LoginInput } from "../../schemas/auth.schemas";
import prisma from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env"

export const createStaffService = async (data: RegisterInput) => {

    // check if username or email already exists
    const existingUser = await prisma.staff.findFirst({
        where: {
            OR: [{email: data.email}, {username: data.username}]
        }
    });

    // Response if username or email already exists
    if (existingUser) {
        const error: any = new Error("Username atau email sudah terdaftar");
        error.status = 400;
        throw error;
    }

    // Hashing password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new staff account on DB
    return await prisma.staff.create({
        data: {
            ...data,
            date_of_birth: new Date(data.date_of_birth),
            password: hashedPassword,
            role: data.role.toUpperCase() as any
        }
    })

}

export const loginStaffService = async (data: LoginInput) => {

    // check username
    const user = await prisma.staff.findUnique({
        where: {username: data.username}
    });

    // validate username and password
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
        const error: any = new Error("Username atau password salah!");
        error.status = 401;
        throw error;
    }

    // Create JWT token if login success
    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        env.JWT_SECRET,
        {expiresIn: "1d"}
    )

    return {token, user};
};