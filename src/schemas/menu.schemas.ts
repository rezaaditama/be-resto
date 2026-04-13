import z from "zod"

// type for get menu filter category and search schema
export const getMenuFilterSchema = z.object({
    category: z.enum(["FOOD", "DRINK"]).optional(),
    search: z.string().optional()
})

// type for create menu schema
export const createMenuSchema = z.object({
    name: z.string().min(1, "Nama menu harus diisi"),
    price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
    description: z.string().min(1, "Deskripsi menu harus diisi"),
    category: z.enum(["FOOD", "DRINK"], {error: "Kategori menu harus FOOD atau DRINK"}),
    stock: z.coerce.number().min(0, "Stock tidak boleh negatif").default(0),
    image_path: z.string().min(1, "Gambar menu harus diisi")
});

// export type for get menu filter schema
export type GetMenuFilterInput = z.infer<typeof getMenuFilterSchema>

// export type for create menu
export type createMenuInput = z.infer<typeof createMenuSchema>