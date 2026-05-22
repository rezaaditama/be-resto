import { z } from "zod";

// create order items schema
const itemSchema = z.object({
  menu_id: z.string().uuid("Format ID Menu tidak valid"),
  quantity: z.number().positive().int("Jumlah harus bilangan bulat").min(1, "Jumlah pembelian minimal 1"),
  notes: z.string().optional(),
});

// base order schemas
const baseOrderSchema = z.object({
  discount_id: z.number().int().positive("Format ID Diskon tidak valid").optional(),
  order_items: z.array(itemSchema).min(1, "Minimal pembelian 1 menu"),
});

// create order schemas
export const createOrderSchema = z.discriminatedUnion("source", [

  // dine in schemas
  baseOrderSchema.extend({
    source: z.enum(["KIOSK", "CASHIER", "WAITER", "QR_SCAN"]),
    table_id: z.number().int().positive("Nomor meja wajib ada untuk pesanan DINE IN"),
  }),

  // online schemas
  baseOrderSchema.extend({
    source: z.literal("ONLINE"),
    address_id: z.string().uuid("Alamat wajib diisi untuk pesanan online"),
  }),
]);

// validate payment schemas
export const validatePaymentSchema = z.object({
  bank_name: z.string().min(3, "Nama bank atau metode pembayaran wajib diisi"),
});

// update status schemas
export const updateStatusSchema = z.object({
  status: z.enum(["VALIDATED", "COOKING", "READY", "COMPLETED", "CANCELED"])
});

export const getReportOrderSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional(),
  
})

// export type get report order schema
export type GetReportOrderInput = z.infer<typeof getReportOrderSchema>;

// export type validate payment schema
export type ValidatePaymentInput = z.infer<typeof validatePaymentSchema>;

// export type update status schema
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// export type create order item schema
export type CreateItemInput = z.infer<typeof itemSchema>;

// export type create order schema
export type CreateOrderInput = z.infer<typeof createOrderSchema>;