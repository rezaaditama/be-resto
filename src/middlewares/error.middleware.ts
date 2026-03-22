import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    const message = err.message || "Terjadi kesalahan pada server";

    console.error(`Error : ${message}`);

    // response error
    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? "Terjadi kesalahan pada server" : message,
        errors: err.errors || null,
    })
}