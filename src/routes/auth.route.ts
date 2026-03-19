import { Router } from "express";
import { loginStaff } from "../services/auth-service/auth.controller";
import { registerStaff } from "../services/auth-service/register.controller";

const AuthRouter = Router();

AuthRouter.post("/login", loginStaff);
AuthRouter.post("/register", registerStaff);

export default AuthRouter;