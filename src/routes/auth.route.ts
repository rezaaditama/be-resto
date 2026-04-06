import { Router } from "express";
import { loginUserController, registerCustomerController, verifyOtpController } from "../services/auth-service/auth.controller";

const AuthRouter = Router();

AuthRouter.post("/register", registerCustomerController)
AuthRouter.post("/login", loginUserController);
AuthRouter.post("/verify-otp", verifyOtpController);

export default AuthRouter;