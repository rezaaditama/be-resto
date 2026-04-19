import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getAddressController, getProfileController, updateProfileController } from "../services/profile-service/profile.controller";
import { authorizeRole } from "../middlewares/role.middleware";

const ProfileRouter = Router();

ProfileRouter.get("/", authenticateToken, authorizeRole(["CUSTOMER"]), getProfileController);
ProfileRouter.get("/address", authenticateToken, authorizeRole(["CUSTOMER"]), getAddressController)
ProfileRouter.put("/update-profile", authenticateToken, authorizeRole(["CUSTOMER"]), updateProfileController);

export default ProfileRouter;
