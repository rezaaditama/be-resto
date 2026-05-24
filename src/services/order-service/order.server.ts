import "../../config/env";
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { initOrderCronJobs } from "../../crons/order-expire.cron";
import OrderRouter from "./order.route";
import { errorHandler } from "../../middlewares/error.middleware";

const app: Application = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3002;

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// middleware global
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// cron job
try {
    initOrderCronJobs();
    console.log("⏰ [CRON SYSTEM] Scheduler pembatalan otomatis aktif di Order Service.");
} catch (cronError) {
    console.error(`❌ Gagal menjalankan Cron Job: ${cronError}`);
}

// router order modul
app.use("/api/order", OrderRouter);

// Error handler
app.use(errorHandler);

const startServer = () => {
    try {
        app.listen(Number(PORT), () => {
            console.log(`🚀 Order service berjalan di port ${PORT}`);
        });
    } catch (error) {
        console.error(`❌ Gagal menjalankan Order Server: ${error}`);
        process.exit(1);
    }
};

startServer();;