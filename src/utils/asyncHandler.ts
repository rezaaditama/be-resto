import { NextFunction, Request, Response, RequestHandler } from "express";

// Async Handler
export const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
}