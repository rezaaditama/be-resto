import { z } from "zod";

// create order schema
const itemSchema = z.object({
  menu_id: z.string().uuid("Format ID Menu salah"),
  quantity: z.number().positive().int().min(1, "Minimal pembelian 1"),
  notes: z.string().optional(),
});

// create order item schema
const createOrderSchema = z.object({
  table_id: z.number().int().positive().optional(),
  discount_id: z.number().int().positive().optional(),
  address_id: z.string().uuid().optional(),
  order_items: z.array(itemSchema).min(1, "Minimal pembelian 1 menu"),
  source: z.enum(["KIOSK", "CASHIER", "WAITER", "ONLINE", "QR_SCAN"]),
  staff_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
});

// export type create order schema
export type CreateItemSchema = z.infer<typeof itemSchema>;

// export type create order item schema
export type CreateOrderSchema = z.infer<typeof createOrderSchema>;