import prisma from "../../lib/prisma";

// Create Category
export const createCategoryService = async (name: string) => {
    return await prisma.categories.create({
        data: {name: name}
    })
}