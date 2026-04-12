import { z } from 'zod';

export const createDiscountSchema = z.object({
  discount_code: z.string().min(1, "Kode diskon wajib diisi").max(10),
  description: z.string().max(255).optional(),
  value: z.number().min(0, "Nilai tidak boleh negatif"), // Decimal di database dibaca number di Zod
  is_active: z.boolean().default(true)
});

export const updateDiscountSchema = createDiscountSchema.partial();