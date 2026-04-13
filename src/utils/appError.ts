// create custom error class
export class AppError extends Error {

    // properties for status code and errors
    public statusCode: number;
    public errors: any;

    // constructor for AppError 
    constructor(message: string, statusCode: number, errors?: any) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;

        // capture stack trace
        Error.captureStackTrace(this, this.constructor);
    };
};