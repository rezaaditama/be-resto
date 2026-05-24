import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { getAddressController, getProfileController, getStaffProfileController, updateProfileController, updateSelfStaffController, updateStaffController } from "./profile.controller";
import { authorizeRole } from "../../middlewares/role.middleware";

const ProfileRouter = Router();

ProfileRouter.get("/", authenticateToken, authorizeRole(["CUSTOMER"]), getProfileController);
ProfileRouter.get("/address", authenticateToken, authorizeRole(["CUSTOMER"]), getAddressController)
ProfileRouter.put("/update-profile", authenticateToken, authorizeRole(["CUSTOMER"]), updateProfileController);
ProfileRouter.get("/profile-staff", authenticateToken, authorizeRole(["ADMIN", "CASHIER", "WAITER", "KIOSK_SYSTEM", "KITCHEN"]), getStaffProfileController)
ProfileRouter.put("/update-staff-profile", authenticateToken, authorizeRole(["ADMIN", "CASHIER", "WAITER", "KIOSK_SYSTEM", "KITCHEN"]), updateSelfStaffController)

export default ProfileRouter;
