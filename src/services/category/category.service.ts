import prisma from "../../lib/prisma";

// Create Category
export const createCategoryService = async (name: string) => {

    // check if category already exists
    const existingCategory = await prisma.categories.findUnique({
        where: { name }
    });

    // Response if category already exists
    if (existingCategory) {
        const error: any = new Error("Kategori sudah ada");
        error.status = 400;
        throw error;
    }

    // Create new category
    return await prisma.categories.create({
        data: {name: name}
    })
}

//  Get All Category
export const getAllCategoryService = async () => {
    return await prisma.categories.findMany();
}