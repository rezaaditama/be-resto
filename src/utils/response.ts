import { Response } from "express"

// Response success
export const responseSuccess = (res: Response, message: string, data?: any, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

// Response error
export const responseError = (res: Response, message: string, errors: any, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};

