import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';

// interface for add property user to request
export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Get token from header request
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // If token not found
    if (!token) {
        return res.status(401).json({
            message: "Akses di tolak, token tidak ditemukan"
        })
    }

    try {
    // verify token with env jwt secret
    const verified = jwt.verify(token, process.env.JWT_SECRET as string);

    // save user data to request
    req.user = verified;

    // next to controller
    next();
    } catch (error: any) {
        res.status(403).json({
            message: "Token tidak valid atau sudah kadaluarsa", error: error.message
        })
    }
}