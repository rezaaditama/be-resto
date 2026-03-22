import dotenv from "dotenv";
dotenv.config();

import express, {Application} from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { routes } from "./routes/index";
import { errorHandler } from "./middlewares/errror.middleware";

const app: Application = express();

// Middleware Global
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Get routes
routes(app);

// Error handler
app.use(errorHandler);

export default app;