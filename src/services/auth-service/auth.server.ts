import "../../config/env";
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import AuthRouter from "./auth.route";
import { errorHandler } from "../../middlewares/error.middleware";

const app: Application = express();

// middleware global
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// router auth modul
app.use("/", AuthRouter);

// router testing
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", service: "auth-service" });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.AUTH_PORT || 3001;

app.listen(Number(PORT), () => {
    console.log(`🚀 Auth Service berjalan di ${PORT}`)
})