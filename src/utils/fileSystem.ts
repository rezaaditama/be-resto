import path from "path";
import fs from "fs";

/**
 * @param relativePath 
 */

export const deleteFile = (relativePath: string | null | undefined): void => {
    if (!relativePath) {
        return;
    };

    // clean image path
    const cleanPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
    const imagePath = path.join(process.cwd(), cleanPath);

    // delete image
    try {
        // check if image exist
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`[FS SUCCESS] File deleted: ${imagePath}`);
        } else {
            console.warn(`[FS WARN] File not found, skipping: ${imagePath}`);
        };
    } catch (err) {
        console.error(`[FS ERROR] Failed to delete file: ${imagePath}`, err);
    };
};