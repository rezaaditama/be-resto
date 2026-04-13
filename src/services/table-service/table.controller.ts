import { Response, Request } from "express";
import { AppError } from "../../utils/appError";
import { asyncHandler } from "../../utils/asyncHandler";
import { responseSuccess } from "../../utils/response";
import { AuthRequest } from "../../types/auth.types";
import { createTableSchema, updateTableSchema } from "../../schemas/table.schemas";
import { createTableService, deleteTableService, getAllTablesService, updateTableService } from "./table.service";

// create table controller
export const createTableController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // Validasi input zod
    const inputValidation = createTableSchema.safeParse(req.body);

    if(!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // Proteksi Role
    // pastikan user sudah login dan role nya adalah Admin
    if (req.user!.role !== "CASHIER") {
        throw new AppError("Akses ditolak, hanya CASHIER yang dapat menambahkan data meja", 403);
    }

    // panggil service
    const result = await createTableService(inputValidation.data);

    // Response sukses
    return responseSuccess(res, "Meja berhasil ditambahkan", result, 201);
});

// read data tables controller
export const getAllTablesControler = asyncHandler(async (req: Request, res: Response) => {

    // panggil service
    const result = await getAllTablesService();

    // kirim response sukses
    return responseSuccess(res, "Berhasil mengambil data meja", result);
})

// update data tables controller
export const updateTableController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    // Ambil ID dari URL parameter dan ubah ke tipe Number
    const tableId = parseInt(req.params.id as string);

    if (isNaN(tableId)) {
        throw new AppError("ID meja tidak valid, harus berupa angka", 400);
    }

    // Validasi input Body menggunakan Zod
    const inputValidation = updateTableSchema.safeParse(req.body);

    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // Panggil service
    const result = await updateTableService(tableId, inputValidation.data);

    //Kirim response
    return responseSuccess(res, "Data meja berhasil diperbarui", result);
});

// delete data table controller
export const deleteTableController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    // Ambil ID dari URL parameter dan parse ke integer (dengan as string agar aman)
    const tableId = parseInt(req.params.id as string);

    if (isNaN(tableId)) {
        throw new AppError("ID meja tidak valid, harus berupa angka", 400);
    }

    // Proteksi Role (Sangat penting untuk fitur hapus)
    if (req.user!.role !== "CASHIER") {
        throw new AppError("Akses ditolak, hanya CASHIER  yang dapat menghapus data meja", 403);
    }

    // Panggil service
    await deleteTableService(tableId);

    // Kirim response (Data dikosongkan karena sudah dihapus)
    return responseSuccess(res, "Data meja berhasil dihapus");
});