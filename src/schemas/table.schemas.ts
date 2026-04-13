import { table_status } from "../../generated/prisma";
import { z } from "zod";

// Schema untuk menambahkan meja baru
export const createTableSchema = z.object({
  table_number: z.string().min(1, "Nomor meja harus di isi"),
  capacity: z.number().min(1, "Kapasitas meja minimal 1 orang"),
});

export const updateTableSchema = z.object({
    table_number: z.string().min(1, "Nomor meja tidak boleh kosong").optional(),
    capacity: z.number().min(1, "Kapsitas minimal 1").optional(),
    status: z.nativeEnum(table_status, {message: "status tidak valid"}).optional()
})

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
