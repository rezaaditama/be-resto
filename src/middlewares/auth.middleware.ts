import { Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import jwt from 'jsonwebtoken';
import { JWTPayload, AuthRequest } from "../types/auth.types";
import { env } from "../config/env";

// Middleware to authenticate JWT token
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {

    // Get token from header request
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // If token not found
    if (!token) {
        return next(new AppError("Akses ditolak, token tidak ditemukan", 401));
    };

    try {
    // Casting JWT payload to know user data
    const verified = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // save user data to request
    req.user = verified;

    // next to controller
    next();

    } catch (err: any) {
        // if token invalid or expired
        return next(new AppError("Token tidak valid atau sudah kadaluarsa", 403));
    };
};