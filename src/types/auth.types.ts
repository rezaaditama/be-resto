import { Request } from "express";

// JWT payload interface for auth
export interface JWTPayload {
    id: string;
    role: "ADMIN" | "CASHIER" | "WAITER" | "KIOSK_SYSTEM";
}

// Auth request interface
export interface AuthRequest extends Request {
    user?: JWTPayload;
}