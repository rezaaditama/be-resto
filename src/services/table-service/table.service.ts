import prisma from '../../lib/prisma';
import { AppError } from '../../utils/appError';
import { CreateTableInput, UpdateTableInput } from './table.schemas';

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
export const getAllTablesService = async (filters?: {status?: "AVAILABLE" | "OCCUPIED" | "DIRTY", table_number?: string, capacity?: number}) => {
    // mengambil semua data dari data base
    const tables = await prisma.tables.findMany({

        where: {

            // filter by status
            status: filters?.status,
        
            // filter by table number
            table_number: {
                contains: filters?.table_number,
                mode: "insensitive"
            },

            // filter by availability
            capacity: filters?.capacity
        },

        orderBy: {
            table_number: 'asc'
        },

        select: {
            id: true,
            table_number: true,
            capacity: true,
            status: true,
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

// auto assign table service
export const autoAssignTableService = async (guest: number) => {
    
    // get table available
    const availableTables = await prisma.tables.findMany({
        where: {
            status: "AVAILABLE",
        },
        orderBy: {
            capacity: "asc"
        }
    });

    // if table not found
    if (availableTables.length === 0) {
        throw new AppError("Maaf, saat ini semua meja sedang penuh. Silahkan cek kembali beberapa saat lagi.", 404, {code: "FULL_HOUSE"});
    };

    // find suitable table
    const suitableTable = availableTables.find((table) => table.capacity >= guest);

    // if suitable table not found
    if (!suitableTable) {
        throw new AppError("Maaf, saat ini tidak ada meja yang cukup besar untuk menampung jumlah tamu Anda.", 404, {code: "NO_SUITABLE_TABLE"});
    };

    // update table status
    await prisma.tables.update({
        where: { id: suitableTable.id },
        data: {
            status: "OCCUPIED"
        }
    });

    // return table
    return suitableTable;
};

export const getTableByIdService = async (tableId: number) => {
    const table = await prisma.tables.findUnique({
        where: {
            id: tableId
        },
        select: {
            id: true,
            table_number: true,
            capacity: true,
            status: true,
            created_at: true,
            updated_at: true,
        }
    });

    // if table not found
    if (!table) {
        throw new AppError("Meja tidak ditemukan", 404, {code: "TABLE_NOT_FOUND"});
    };

    // return table
    return table;
}