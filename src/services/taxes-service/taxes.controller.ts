import { Request, Response } from 'express';
import * as taxService from './taxes.service';

export const createTaxController = async (req: Request, res: Response) => {
  try {
    // Ambil data dari body request (Postman)
    const taxData = req.body; 
    
    // Panggil service untuk menyimpan ke database
    const result = await taxService.createTax(taxData);
    
    // Kirim response sukses
    res.status(201).json({
      message: "Data pajak berhasil ditambahkan",
      data: result
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan pada server", error });
  }
};

export const getAllTaxesController = async (req: Request, res: Response) => {
  try {
    // Panggil service untuk mengambil semua data
    const result = await taxService.getAllTaxes();
    
    res.status(200).json({
      message: "Data pajak berhasil diambil",
      data: result
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil data", error });
  }
};

export const updateTaxController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Mengambil ID dari URL (contoh: /api/taxes/1)
    const taxData = req.body;
    
    const result = await taxService.updateTax(Number(id), taxData);
    
    res.status(200).json({
      message: "Data pajak berhasil diubah",
      data: result
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat mengubah data", error });
  }
};
  
export const deleteTaxController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Mengambil ID dari URL
    
    await taxService.deleteTax(Number(id));
    
    res.status(200).json({
      message: "Data pajak berhasil dihapus"
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat menghapus data", error });
  }
};