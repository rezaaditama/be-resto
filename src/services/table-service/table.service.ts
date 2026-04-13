import prisma from '../../lib/prisma';
import { AppError } from '../../utils/appError';
import { CreateTableInput, UpdateTableInput } from '../../schemas/table.schemas';

// Create tables schema
export const createTableService = async (data: CreateTableInput) => {
    
    // cek ketersediaan meja
    const existingTable = await prisma.tables.findUnique({
        where: {
            table_number: data.table_number
        }
    });

    if(existingTable) {
        throw new AppError(`Meja dengan nomor ${data.table_number} sudah ada`, 409);
    }

    // Buat meja baru
    const newTable = await prisma.tables.create({
        data: {
            table_number: data.table_number,
            capacity: data.capacity
        }
    });

    return newTable;
};

// Read data tables service
export const getAllTablesService = async () => {
    // mengambil semua data dari data base
    const tables = await prisma.tables.findMany({
        orderBy: {
            table_number: 'asc'
        }
    });

    return tables;
}

// update data tables service
export const updateTableService = async (tableId: number, data: UpdateTableInput) => {
    
    // Cek apakah meja dengan ID tersebut ada
    const table = await prisma.tables.findUnique({
        where: { id: tableId }
    });

    if (!table) {
        throw new AppError("Meja tidak ditemukan", 404);
    }

    // Jika nomor meja diubah, pastikan nomor baru belum dipakai meja lain
    if (data.table_number && data.table_number !== table.table_number) {
        const existingTable = await prisma.tables.findUnique({
            where: { table_number: data.table_number }
        });

        if (existingTable) {
            throw new AppError(`Meja dengan nomor ${data.table_number} sudah terdaftar`, 409);
        }
    }

    // Lakukan proses update
    const updatedTable = await prisma.tables.update({
        where: { id: tableId },
        data: {
            table_number: data.table_number,
            capacity: data.capacity,
            status: data.status
        }
    });

    return updatedTable;
};

// delete data table service
export const deleteTableService = async (tableId: number) => {
    
    // Cek apakah meja dengan ID tersebut ada
    const table = await prisma.tables.findUnique({
        where: { id: tableId }
    });

    if (!table) {
        throw new AppError("Meja tidak ditemukan", 404);
    }

    // 2. Hapus data meja
    await prisma.tables.delete({
        where: { id: tableId }
    });

    return null;
};