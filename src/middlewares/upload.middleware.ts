import multer from "multer";
import path from "path"
import { AppError } from "../utils/appError";
import fs from "fs";

// check uploads folder is exist
const uploadDir = path.resolve(process.cwd(), "uploads", "menus");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

// configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `menu-${uniqueSuffix}${path.extname(file.originalname)}`)
    }
});

// filter file type
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {

    // allowed file type
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new AppError("Hanya file gambar (JPG/PNG) yang diizinkan", 400), false)
    }
};

// configure multer for menu image
export const uploadMenuImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
})