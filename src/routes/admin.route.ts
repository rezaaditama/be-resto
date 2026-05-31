import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getAllCustomersController, getAllStaffController, getDetailStaffController, registerStaffController, updateStaffPasswordController } from "../services/admin-service/admin.controller";
import { authorizeRole } from "../middlewares/role.middleware";
import { updateStaffController } from "../services/profile-service/profile.controller";

const AdminRoute = Router();

AdminRoute.post("/register-staff", registerStaffController);
AdminRoute.get("/customer", authenticateToken, authorizeRole(["ADMIN"]),  getAllCustomersController);
AdminRoute.get("/staff", authenticateToken, authorizeRole(["ADMIN"]), getAllStaffController);
AdminRoute.get("/staff/:id", authenticateToken, authorizeRole(["ADMIN"]), getDetailStaffController);
AdminRoute.put("/update-staff/:id", authenticateToken, authorizeRole(["ADMIN"]), updateStaffController);
AdminRoute.patch("/update-staff-password/:id", authenticateToken, authorizeRole(["ADMIN"]), updateStaffPasswordController);

export default AdminRoute;