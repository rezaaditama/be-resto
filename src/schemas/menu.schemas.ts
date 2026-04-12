import z from "zod"

// type for get menu filter category and search schema
export const getMenuFilterSchema = z.object({
    category: z.enum(["FOOD", "DRINK"]).optional(),
    search: z.string().optional()
})

export const createMenuSchema = z.object({
    name: z.string().min(1, "Nama menu harus diisi"),
    price: z.number().min(0, "Harga tidak boleh negatif"),
    description: z.string().min(1, "Deskripsi menu harus diisi"),
    category: z.enum(["FOOD", "DRINK"], {error: "Kategori menu harus FOOD atau DRINK"}),
    stock: z.number().min(0, "Stock tidak boleh negatif").default(0),
    is_available: z.boolean().default(false)
});

// export type for get menu filter schema
export type GetMenuFilterInput = z.infer<typeof getMenuFilterSchema>

// export type for create menu
export type createMenuInput = z.infer<typeof createMenuSchema>