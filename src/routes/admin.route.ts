import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { updateStaffController } from "../services/profile-service/profile.controller";

// Import digabung jadi satu dan disesuaikan dengan nama fungsi yang baru
import { 
    getAllCustomersController, 
    getAllStaffController, 
    registerStaffController,
    getDetailStaffController,
    deleteStaffController,
    updateStaffPasswordController,
    getDashboardController,
    getReportController
} from "../services/admin-service/admin.controller";

const AdminRoute = Router();

// PENDAFTARAN PEGAWAI
AdminRoute.post("/register-staff", authenticateToken, authorizeRole(["ADMIN"]), registerStaffController);

// MASTER DATA (Customer & Staff)
AdminRoute.get("/customer", authenticateToken, authorizeRole(["ADMIN"]), getAllCustomersController);
AdminRoute.get("/staff", authenticateToken, authorizeRole(["ADMIN"]), getAllStaffController);

// AKSI SPESIFIK PEGAWAI
AdminRoute.get("/staff/:id", authenticateToken, authorizeRole(["ADMIN"]), getDetailStaffController);
AdminRoute.delete("/staff/:id", authenticateToken, authorizeRole(["ADMIN"]), deleteStaffController);

// Menggunakan PATCH sesuai standar temanmu untuk update sebagian data (password)
AdminRoute.patch("/update-staff-password/:id", authenticateToken, authorizeRole(["ADMIN"]), updateStaffPasswordController);

// Update profil meminjam dari modul profile-service
AdminRoute.put("/update-staff/:id", authenticateToken, authorizeRole(["ADMIN"]), updateStaffController);

// DASHBOARD & LAPORAN
AdminRoute.get("/dashboard", authenticateToken, authorizeRole(["ADMIN"]), getDashboardController);
AdminRoute.get("/reports", authenticateToken, authorizeRole(["ADMIN"]), getReportController);

export default AdminRoute;