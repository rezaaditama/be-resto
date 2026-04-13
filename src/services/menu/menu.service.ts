import { createMenuInput } from "../../schemas/menu.schemas";
import prisma from "../../lib/prisma";
import { AppError } from "../../utils/appError";

// Get all menu service
export const getAllMenuService = async (filters?: {category?: "FOOD" | "DRINK", search?: string}) => {

    // Get data from menus table
    const menus = await prisma.menus.findMany({
        
        // filtering data (optional)
        where: {

            // filter by category
            category: filters?.category ? filters.category : undefined,
        
            // filter by search
            name: {
                contains: filters?.search ? filters.search : undefined,
                mode: "insensitive"
            }
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
            description: true
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
            }
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