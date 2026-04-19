import prisma from "../../lib/prisma";

export const createDiscount = async (data: any) => {
  return await prisma.discount.create({
    data: {
      discount_code: data.discount_code,
      discount_name: data.discount_name,
      value: data.value,
      min_purches: data.min_purches,
      start_date: data.start_date,
      end_date: data.end_date,
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