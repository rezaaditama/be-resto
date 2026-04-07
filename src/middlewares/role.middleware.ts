import { NextFunction, Response } from "express"
import { AuthRequest } from "../types/auth.types";

export const authorizeRole = (allowRoles: string[]) => {

    // return middleware function for check role
    return (req: AuthRequest, res: Response, next: NextFunction) => {

        // if user is not allowed
        if (!req.user || !allowRoles.includes(req.user?.role)) {
            const error: any = new Error(`Akses ditolak. Role ${req.user?.role || "Unknown"} tidak diizinkan`);
            error.statusCode = 403;
            return next(error);
        }

        // next to controller
        next();
    };
}