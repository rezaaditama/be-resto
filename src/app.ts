import dotenv from "dotenv";
dotenv.config();

import express, {Application} from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { routes } from "./routes/index";

const app: Application = express();

// Middleware Global
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Get routes
routes(app);

export default app;