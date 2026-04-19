import z from "zod"

// type for get menu filter category and search schema
export const getMenuFilterSchema = z.object({
    category: z.enum(["FOOD", "DRINK"]).optional(),
    search: z.string().trim().optional(),
    is_available: z.preprocess((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
    }, z.boolean().optional())
})

// type for create menu schema
export const createMenuSchema = z.object({
    name: z.string().min(1, "Nama menu harus diisi"),
    price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
    description: z.string().min(1, "Deskripsi menu harus diisi"),
    category: z.enum(["FOOD", "DRINK"], {error: "Kategori menu harus FOOD atau DRINK"}),
    stock: z.coerce.number().min(0, "Stock tidak boleh negatif").default(0),
    image_path: z.string().optional()
});

// type for get menu by id schema
export const getMenuByIdSchema = z.object({
    id: z.string().uuid("Format ID tidak valid")
});

// type for update menu by id schema
export const updateMenuSchema = z.object({
    name: z.string().min(1, "Nama menu harus diisi").optional(),
    price: z.coerce.number().min(0, "Harga tidak boleh negatif").optional(),
    description: z.string().min(1, "Deskripsi menu harus diisi").optional(),
    category: z.enum(["FOOD", "DRINK"], {error: "Kategori harus berisi FOOD atau DRINK"}).optional(),
    stock: z.coerce.number().min(0, "Stock tidak boleh negatif").optional()
});

// export type for update menu by id schema
export type updateMenuInput = z.infer<typeof updateMenuSchema>;

// export type for get menu by id schema
export type GetMenuByIdInput = z.infer<typeof getMenuByIdSchema>;

// export type for get menu filter schema
export type GetMenuFilterInput = z.infer<typeof getMenuFilterSchema>

// export type for create menu
export type createMenuInput = z.infer<typeof createMenuSchema>