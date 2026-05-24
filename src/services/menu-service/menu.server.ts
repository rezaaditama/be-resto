import "../../config/env";
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import MenuRouter from "./menu.route";
import { errorHandler } from "../../middlewares/error.middleware";

const app: Application = express();
const PORT = process.env.MENU_SERVICE_PORT || 3003;

// middleware global
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/menu", MenuRouter);

// Error handler
app.use(errorHandler);

app.listen(Number(PORT), () => {
    console.log(`🚀 Menu Service berjalan di ${PORT}`)
})