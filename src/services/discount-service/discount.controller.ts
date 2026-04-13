import { Request, Response } from 'express';
import * as discountService from './discount.service';
import { createDiscountSchema, updateDiscountSchema } from '../../schemas/discount.schemas';

export const createDiscountController = async (req: Request, res: Response) => {
  try {
    // Validasi input pakai Zod
    const validatedData = createDiscountSchema.parse(req.body);
    const result = await discountService.createDiscount(validatedData);
    
    res.status(201).json({
      message: "Data diskon berhasil ditambahkan",
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Terjadi kesalahan" });
  }
};

export const getAllDiscountsController = async (req: Request, res: Response) => {
  try {
    const result = await discountService.getAllDiscounts();
    res.status(200).json({ data: result });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal mengambil data diskon" });
  }
};

export const updateDiscountController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateDiscountSchema.parse(req.body);
    const result = await discountService.updateDiscount(Number(id), validatedData);
    
    res.status(200).json({
      message: "Data diskon berhasil diubah",
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDiscountController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await discountService.deleteDiscount(Number(id));
    res.status(200).json({ message: "Data diskon berhasil dihapus" });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal menghapus diskon" });
  }
};