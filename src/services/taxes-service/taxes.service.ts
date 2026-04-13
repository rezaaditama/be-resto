import prisma from "../../lib/prisma";

export const createTax = async (data: any) => {
  // Logika untuk insert data ke tabel taxes menggunakan Prisma
  const newTax = await prisma.taxes.create({
    data: {
      name: data.name,
      rate: data.rate,
      is_active: data.is_active
    }
  });
  return newTax;
};

export const getAllTaxes = async () => {
  // Logika untuk mengambil semua data pajak
  return await prisma.taxes.findMany();
};

export const updateTax = async (id: number, data: any) => {
  // Update data berdasarkan ID
  const updatedTax = await prisma.taxes.update({
    where: { id: Number(id) },
    data: data
  });
  return updatedTax;
};

export const deleteTax = async (id: number) => {
  // Hapus data berdasarkan ID
  const deletedTax = await prisma.taxes.delete({
    where: { id: Number(id) }
  });
  return deletedTax;
};