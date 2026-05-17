import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getNotificationsController, markAllAsReadController, markNotificationAsReadController } from "../services/notification-service/notification.controller";

const NotifRoute = Router();

NotifRoute.use(authenticateToken);

// Mengambil semua notifikasi
NotifRoute.get("/", getNotificationsController);
// Menandai SEMUA notifikasi sudah dibaca
NotifRoute.put("/read-all", markAllAsReadController);
// Menandai SATU notifikasi sudah dibaca (Berdasarkan ID)
NotifRoute.put("/:id/read", markNotificationAsReadController); 

export default NotifRoute;