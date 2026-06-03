import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { addCustomerAddressController, deleteCustomerAddressController, getAddressController, getProfileController, getStaffProfileController, updateCustomerAddressController, updateCustomerPasswordController, updateProfileController, updateSelfStaffController, updateStaffController } from "./profile.controller";
import { authorizeRole } from "../../middlewares/role.middleware";

const ProfileRouter = Router();

// Profile
ProfileRouter.get("/", authenticateToken, authorizeRole(["CUSTOMER"]), getProfileController);
ProfileRouter.put("/update-profile", authenticateToken, authorizeRole(["CUSTOMER"]), updateProfileController);
ProfileRouter.patch("/update-password", authenticateToken, authorizeRole(["CUSTOMER"]), updateCustomerPasswordController);

// Alamat
ProfileRouter.get("/address", authenticateToken, authorizeRole(["CUSTOMER"]), getAddressController);
ProfileRouter.post("/address", authenticateToken, authorizeRole(["CUSTOMER"]), addCustomerAddressController);
ProfileRouter.put("/address/:addressId", authenticateToken, authorizeRole(["CUSTOMER"]), updateCustomerAddressController);
ProfileRouter.delete("/address/:addressId", authenticateToken, authorizeRole(["CUSTOMER"]), deleteCustomerAddressController);

// profile-staff
ProfileRouter.get("/profile-staff", authenticateToken, authorizeRole(["ADMIN", "CASHIER", "WAITER", "KIOSK_SYSTEM", "KITCHEN"]), getStaffProfileController)
ProfileRouter.put("/update-staff-profile", authenticateToken, authorizeRole(["ADMIN", "CASHIER", "WAITER", "KIOSK_SYSTEM", "KITCHEN"]), updateSelfStaffController)

export default ProfileRouter;
