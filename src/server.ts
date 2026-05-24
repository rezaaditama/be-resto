import "./config/env";
import app from "./app";
// import { initOrderCronJobs } from "./crons/order-expire.cron";

const PORT = process.env.PORT || 3000;

const startServer = () => {
    try {
        // initOrderCronJobs();
        // console.log("⏰ [CRON SYSTEM] Scheduler pembatalan otomatis aktif.");

        app.listen(Number(PORT), () => {
            console.log(`🚀 Server berjalan di http://localhost:${PORT}`)
        })
    } catch (error) {
        console.log(`❌ Gagal menjalankan server: ${error}`)
        process.exit(1);
    }
}

startServer();