import { z } from 'zod';

export const createDiscountSchema = z.object({
  discount_code: z.string().min(1, "Kode diskon wajib diisi").max(10),
  discount_name: z.string().max(255).optional(),
  value: z.number().min(0, "Nilai tidak boleh negatif"), // Decimal di database dibaca number di Zod
  min_purches: z.number().min(0, "Nilai tidak boleh negatif"),
  start_date: z.date(),
  end_date: z.date(),
  is_active: z.boolean().default(true)
});

export const updateDiscountSchema = createDiscountSchema.partial();