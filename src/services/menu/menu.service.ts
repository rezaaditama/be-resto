import { createMenuInput, updateMenuInput } from "../../schemas/menu.schemas";
import prisma from "../../lib/prisma";
import { AppError } from "../../utils/appError";

// Get all menu service
export const getAllMenuService = async (filters?: {category?: "FOOD" | "DRINK", search?: string, is_available?: boolean}) => {

    // Get data from menus table
    const menus = await prisma.menus.findMany({
        
        // filtering data (optional)
        where: {

            // filter by deleted_at
            deleted_at: null,

            // filter by category
            category: filters?.category,
        
            // filter by search
            name: {
                contains: filters?.search,
                mode: "insensitive"
            },

            // filter by availability
            is_available: filters?.is_available
        },

        // filtering data from table menus
        orderBy:[ 
            // Sort by availability
            {is_available: 'desc'},

            // sort by name
            {name: 'asc'}
        ],

        // select data from table menus
        select: {
            id: true,
            name: true,
            price: true,
            image_path: true,
            category: true,
            is_available: true,
            description: true,
            stock: true
        }
    });

    // return data menus
    return menus;
};

export const createMenuService = async (data: createMenuInput) => {
    
    // check if menu already exist
    const existingMenu = await prisma.menus.findFirst({
        where: {
            name: {
                equals: data.name,
                mode: "insensitive"
            },
            deleted_at: null
        }
    });

    // if menu already exist
    if (existingMenu) {
        throw new AppError(`Menu dengan nama ${data.name} sudah ada`, 409);
    };

    // set is_available based on stock
    const isAvailable = data.stock > 0;

    // create menu
    const newMenu = await prisma.menus.create({
        data: {
            name: data.name,
            price: data.price,
            description: data.description,
            category: data.category,
            stock: data.stock,
            image_path: data.image_path,
            is_available: isAvailable
        }
    });

    // return data menu
    return newMenu;
};

// get menu by id service
export const getMenuByIdService = async (id: string) => {

    // Get menu by id from table menu
    const menu = await prisma.menus.findUnique({
        where: {
            id: id,
            deleted_at: null
        },
        select: {
            id: true,
            name: true,
            description: true,
            stock: true,
            is_available: true,
            price: true,
            image_path: true,
        }
    });

    // if menu not found
    if (!menu) {
        throw new AppError("Menu tidak ditemukan", 404)
    };

    return menu;
};

// update menu service
export const updateMenuService = async (id: string, data: updateMenuInput) => {

    // check if menu exist
    const existingMenu = await prisma.menus.findUnique({
        where: {
            id: id,
            deleted_at: null
        }
    });

    // if menu not found
    if (!existingMenu) {
        throw new AppError("Menu tidak ditemukan", 404);
    };

    // check if menu name already exist
    if (data.name && data.name.toLowerCase() !== existingMenu.name.toLowerCase()) {
        
        // check name from table menu
        const duplicateName = await prisma.menus.findFirst({
            where: {
                name: {
                    equals: data.name,
                    mode: "insensitive"
                },
                id: {
                    not: id
                },
                deleted_at: null
            }
        });

        // if menu name already exist
        if (duplicateName) {
            throw new AppError(`Menu dengan nama ${data.name} sudah ada`, 409);
        };
    };

    // check stock
    const currentStock = data.stock !== undefined ? data.stock : existingMenu.stock;

    // set is_available based on stock
    const isAvailable = currentStock !== null ? currentStock > 0 : false;

    // update menu
    return await prisma.menus.update({
        where: {id: id},
        data: {
            ...data,
            is_available: isAvailable
        }
    });
};

// delete menu service
export const deleteMenuService = async (id: string) => {

    const existingMenu = await prisma.menus.findFirst({

        // check if menu already deleted
        where: {
            id: id,
            deleted_at: null
        }
    });

    // if menu not found
    if (!existingMenu) {
        throw new AppError("Menu tidak ditemukan atau sudah dihapus", 404);
    };

    // delete menu
    return await prisma.menus.update({
        where: {id: id},
        data: {
            deleted_at: new Date(),
            is_available: false,
            stock: 0
        }
    });
};