import { table_status } from "../../../generated/prisma";
import { z } from "zod";
  
export const getTableFilterSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "DIRTY"]).optional(),
  capacity: z.number().optional(),
  table_number: z.string().trim().optional()
});

// Schema untuk menambahkan meja baru
export const createTableSchema = z.object({
  table_number: z.string().min(1, "Nomor meja harus di isi"),
  capacity: z.number().min(1, "Kapasitas meja minimal 1 orang"),
});

export const updateTableSchema = z.object({
    table_number: z.string().min(1, "Nomor meja tidak boleh kosong").optional(),
    capacity: z.number().min(1, "Kapsitas minimal 1").optional(),
    status: z.nativeEnum(table_status, {message: "status tidak valid"}).optional()
});

// schema for auto assign table
export const autoAssignTableSchema = z.object({
   guest: z.number().min(1, "Minimal jumlah tamu adalah 1") 
});

// schema for verify table id using base64
export const verifyTableIdSchema = z.object({
  id: z.string().min(1, "ID tidak boleh kosong").regex(/^[a-zA-Z0-9+/]*={0,2}$/, "Format token ID meja tidak valid")
});

// schema for get table by id
export const getTableByIdSchema = z.object({
    id: z.number().min(1, "ID meja harus diisi").positive("ID meja harus berupa angka positif").int("ID meja harus berupa angka")
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type AutoAssignTableInput = z.infer<typeof autoAssignTableSchema>;
export type VerifyTableIdInput = z.infer<typeof verifyTableIdSchema>;
export type GetTableByIdInput = z.infer<typeof getTableByIdSchema>;