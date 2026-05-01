import "./config/env"
import express, {Application} from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { routes } from "./routes/index";
import { errorHandler } from "./middlewares/error.middleware";
import path from "path";

const app: Application = express();

// Middleware Global
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Get routes
routes(app);

// Error handler
app.use(errorHandler);

export default app;