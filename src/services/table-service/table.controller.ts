import { Response, Request } from "express";
import { AppError } from "../../utils/appError";
import { asyncHandler } from "../../utils/asyncHandler";
import { responseSuccess } from "../../utils/response";
import { AuthRequest } from "../../types/auth.types";
import { autoAssignTableSchema, createTableSchema, getTableByIdSchema, getTableFilterSchema, updateTableSchema, verifyTableIdSchema } from "./table.schemas";
import { autoAssignTableService, createTableService, deleteTableService, getAllTablesService, getTableByIdService, updateTableService } from "./table.service";

// create table controller
export const createTableController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // Validasi input zod
    const inputValidation = createTableSchema.safeParse(req.body);

    if(!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    }

    // panggil service
    const result = await createTableService(inputValidation.data);

    // Response sukses
    return responseSuccess(res, "Meja berhasil ditambahkan", result, 201);
});

// read data tables controller
export const getAllTablesControler = asyncHandler(async (req: Request, res: Response) => {

    const filters = getTableFilterSchema.parse(req.query)

    // panggil service
    const result = await getAllTablesService(filters);

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

    // Panggil service
    await deleteTableService(tableId);

    // Kirim response (Data dikosongkan karena sudah dihapus)
    return responseSuccess(res, "Data meja berhasil dihapus");
});

export const autoAssignTableController = asyncHandler(async (req: Request, res: Response) => {
    
    // Validasi input Zod
    const inputValidation = autoAssignTableSchema.safeParse(req.body);

    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    };

    const assignTable = await autoAssignTableService(inputValidation.data.guest);

    const maskedId = Buffer.from(assignTable.id.toString()).toString("base64");

    // Kirim response
    return responseSuccess(res, "Meja berhasil ditambahkan", {
        masked_id: maskedId,
        table_number: assignTable.table_number,
        guest: inputValidation.data.guest
    });
});

export const verifyTableIdController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    // check role
    const role = req.user?.role;

    // validation input
    const inputValidation = verifyTableIdSchema.safeParse(req.params);

    // if validation failed
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    };

    try {
        
        // decode base64
        const decodeId = Buffer.from(inputValidation.data.id, 'base64').toString('utf-8');
        const tableId = parseInt(decodeId, 10);

        // if table id is not a number
        if (isNaN(tableId)) {
            throw new AppError("ID meja tidak valid, harus berupa angka", 400);
        };

        // get table by id
        const table = await getTableByIdService(tableId);

        if (table.status !== "AVAILABLE" && role === "GUEST") {
            throw new AppError(
                `Maaf, meja ${table.table_number} sedang digunakan, silahkan gunakan meja lain`,
                400,
                { code: "TABLE_NOT_AVAILABLE", current_status: table.status }
            );
        };

        // return table
        return responseSuccess(res, "Meja berhasil diverifikasi", {
            id: tableId,
            table_number: table.table_number,
            status: table.status,
            capacity: table.capacity
        });

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        };
        throw new AppError("Gagal memverifikasi meja", 500);
    }
});

export const getTableByIdController = asyncHandler(async (req: Request, res: Response) => {

    // validation input
    const inputValidation = getTableByIdSchema.safeParse(req.params);

    // if validation failed
    if (!inputValidation.success) {
        throw new AppError("Validasi gagal", 400, inputValidation.error.flatten().fieldErrors);
    };

    // get table by id
    const table = await getTableByIdService(inputValidation.data.id);

    // encode table id to base64
    const maskedId = Buffer.from(table.id.toString()).toString("base64");

    // return table
    return responseSuccess(res, "Meja berhasil diambil", {
        id: table.id,
        masked_id: maskedId,
        table_number: table.table_number,
        capacity: table.capacity,
        status: table.status,
        created_at: table.created_at,
        updated_at: table.updated_at
    });
})