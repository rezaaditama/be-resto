import { Router } from "express";
import { forgotPasswordController, loginUserController, logoutUserController, registerCustomerController, registerStaffController, resendForgotPasswordOtp, resendOtpController, resetPasswordController, verifyOtpController, verifyResetOtpController } from "../services/auth-service/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const AuthRouter = Router();

AuthRouter.post("/register", registerCustomerController)
AuthRouter.post("/login", loginUserController);
AuthRouter.post("/verify-otp", verifyOtpController);
AuthRouter.post("/logout", authenticateToken, logoutUserController);
AuthRouter.post("/register-staff", registerStaffController);
AuthRouter.post("/resend-otp", resendOtpController);
AuthRouter.post("/forgot-password", forgotPasswordController);
AuthRouter.post("/verify-reset-otp", verifyResetOtpController);
AuthRouter.post("/resend-otp-forgot-password", resendForgotPasswordOtp);
AuthRouter.post("/reset-password", authenticateToken, resetPasswordController);

export default AuthRouter;