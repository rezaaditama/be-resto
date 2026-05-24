import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import DiscountRouter from "./discount.route";
import { errorHandler } from "../../middlewares/error.middleware";
import { initDiscountCronJobs } from "../../crons/discount-expire";


const app: Application = express();
const PORT = process.env.DISCOUNT_SERVICE_PORT || 3005;

// Middleware Global
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// cron job
try {
    initDiscountCronJobs();
    console.log("⏰ [CRON SYSTEM] Scheduler pembatalan otomatis aktif di Discount Service.");
} catch (cronError) {
    console.error(`❌ Gagal menjalankan Cron Job: ${cronError}`);
}

// Router Modul Discount
app.use("/api/discount", DiscountRouter);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", service: "discount-service" });
});

// Global Error Handler
app.use(errorHandler);

const startServer = () => {
    try {
        app.listen(Number(PORT), () => {
            console.log(`🚀 Discount service berjalan di port ${PORT}`);
        });
    } catch (error) {
        console.error(`❌ Gagal menjalankan Discount Server: ${error}`);
        process.exit(1);
    }
};

startServer();