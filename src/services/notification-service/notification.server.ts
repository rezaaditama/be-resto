import "../../config/env";
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "../../middlewares/error.middleware";
import NotifRoute from "./notification.route";

const app: Application = express();

// middleware global
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// router auth modul
app.use("/api/notification", NotifRoute);

// router testing
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", service: "notif-service" });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3006;

app.listen(Number(PORT), () => {
    console.log(`🚀 Notif Service berjalan di ${PORT}`)
})