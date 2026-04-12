import prisma from "../../lib/prisma";

export const createDiscount = async (data: any) => {
  return await prisma.discount.create({
    data: {
      discount_code: data.discount_code,
      description: data.description,
      value: data.value,
      is_active: data.is_active,
    },
  });
};

export const getAllDiscounts = async () => {
  return await prisma.discount.findMany();
};

export const updateDiscount = async (id: number, data: any) => {
  return await prisma.discount.update({
    where: { id: Number(id) },
    data: data,
  });
};

export const deleteDiscount = async (id: number) => {
  return await prisma.discount.delete({
    where: { id: Number(id) },
  });
};