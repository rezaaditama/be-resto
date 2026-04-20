/*
  Warnings:

  - You are about to drop the column `taxes_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `taxes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_taxes_id_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "taxes_id";

-- DropTable
DROP TABLE "taxes";
