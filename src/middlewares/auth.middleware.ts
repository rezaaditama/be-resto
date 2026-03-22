import { Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { JWTPayload, AuthRequest } from "../types/auth.types";
import { env } from "../config/env";

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {

    // Get token from header request
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // If token not found
    if (!token) {
        const error: any = new Error("Akses ditolak, token tidak ditemukan");
        error.status = 401;
        return next(error);
    }

    try {
    // Casting JWT payload to know user data
    const verified = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // save user data to request
    req.user = verified;

    // next to controller
    next();

    } catch (err: any) {
        const error: any = new Error("Token tidak valid atau sudah kadaluarsa");
        error.status = 403;
        return next(error);
    }
}