import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { updateStaffController } from "../services/profile-service/profile.controller";
import { 
    getAllCustomersController, 
    getAllStaffController, 
    registerStaffController,
    getStaffByIdController,
    deleteStaffController,
    changeStaffPasswordController,
    getDashboardController,
    getReportController
} from "../services/admin-service/admin.controller";

const AdminRoute = Router();

// ==========================================
// 1. PENDAFTARAN PEGAWAI
// ==========================================
AdminRoute.post("/register-staff", authenticateToken, authorizeRole(["ADMIN"]), registerStaffController);

// ==========================================
// 2. MASTER DATA (Customer & Staff)
// ==========================================
AdminRoute.get("/customer", authenticateToken, authorizeRole(["ADMIN"]), getAllCustomersController);
AdminRoute.get("/staff", authenticateToken, authorizeRole(["ADMIN"]), getAllStaffController);

// ==========================================
// 3. AKSI SPESIFIK PEGAWAI
// ==========================================
AdminRoute.get("/staff/:id", authenticateToken, authorizeRole(["ADMIN"]), getStaffByIdController);
AdminRoute.delete("/staff/:id", authenticateToken, authorizeRole(["ADMIN"]), deleteStaffController);
AdminRoute.put("/staff/change-password/:id", authenticateToken, authorizeRole(["ADMIN"]), changeStaffPasswordController);

// Update profil meminjam dari modul profile-service
AdminRoute.put("/update-staff/:id", authenticateToken, authorizeRole(["ADMIN"]), updateStaffController);

// ==========================================
// 4. DASHBOARD & LAPORAN
// ==========================================
AdminRoute.get("/dashboard", authenticateToken, authorizeRole(["ADMIN"]), getDashboardController);
AdminRoute.get("/reports", authenticateToken, authorizeRole(["ADMIN"]), getReportController);

export default AdminRoute;