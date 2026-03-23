import { z } from "zod";

// create menu schema
export const createMenuSchema = z.object({
    body: z.object({
        name: z.string().min(3, "Nama menu minimal 3 karakter"),
        category_id: z.string().uuid("Format UUID tidak valid"),
        description: z.string().optional(),
        price: z.number().positive("Minimal harga 0 Rupiah"),
        stock: z.number().nonnegative("Stok minimal 0"),
        is_available: z.boolean().default(true),
        image_url: z.string().url("Format URL tidak valid")
    })
})