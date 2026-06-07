import "../../config/env";
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import TableRouter from "./table.route";
import { errorHandler } from "../../middlewares/error.middleware";

const app: Application = express();

// middleware global
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// router table modul
app.use("/api/table", TableRouter);

// router testing
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", service: "table-service" });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.TABLE_SERVICE_PORT || 3007;

app.listen(Number(PORT), () => {
    console.log(`🚀 Table Service berjalan di ${PORT}`)
})