import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// env schema
const envSchema = z.object({
    PORT: z.string().default("3000"),
    DATABASE_URL: z.string().url("DATABASE_URL harus berupa URL yang valid"),
    JWT_SECRET: z.string().min(5, "JWT_SECRET minimal 5 karakter"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SMTP_HOST: z.string().min(1, "SMPT_HOST harus diisi"),
    SMTP_PORT: z.string().default("587"),
    SMTP_USER: z.string().email("SMPT_USER harus berupa email yang valid"),
    SMTP_PASS: z.string().min(1, "SMPT_PASS harus diisi")
});

// parse env
const envParsed = envSchema.safeParse(process.env);

// if env not valid
if (!envParsed.success){
    console.error("❌ konfigurasi .env tidak valid: ")
    console.error(envParsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = envParsed.data;