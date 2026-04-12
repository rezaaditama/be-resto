import { z } from 'zod';

export const createTaxSchema = z.object({
  name: z.string().min(1, "Nama pajak tidak boleh kosong").max(50),
  rate: z.number().int("Rate harus berupa angka bulat"),
  is_active: z.boolean().default(true)
});


export const updateTaxSchema = z.object({
    name: z.string().min(1, "Nama pajak tidak boleh kosong").max(50).optional(),
    rate: z.number().int("Rate harus berupa angka bulat").optional(),
    is_active: z.boolean().optional()
});
