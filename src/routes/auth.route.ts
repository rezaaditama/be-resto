import { Router } from "express";
import { forgotPasswordController, loginUserController, logoutUserController, registerCustomerController, registerStaffController, resendOtpController, resetPasswordController, updateProfileController, verifyOtpController, verifyResetOtpController } from "../services/auth-service/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";

const AuthRouter = Router();

AuthRouter.post("/register", registerCustomerController)
AuthRouter.post("/login", loginUserController);
AuthRouter.post("/verify-otp", verifyOtpController);
AuthRouter.post("/logout", authenticateToken, logoutUserController);
AuthRouter.post("/register-staff", registerStaffController);
AuthRouter.post("/resend-otp", resendOtpController);
AuthRouter.post("/forgot-password", forgotPasswordController);
AuthRouter.post("/verify-reset-otp", verifyResetOtpController);
AuthRouter.post("/reset-password", authenticateToken,  authorizeRole(["CUSTOMER"]), resetPasswordController);
AuthRouter.put("/update-profile", authenticateToken, authorizeRole(["CUSTOMER"]), updateProfileController);

export default AuthRouter;