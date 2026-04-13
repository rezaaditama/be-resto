/*
  Warnings:

  - Added the required column `category` to the `menus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "category" "category" NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "address_id" UUID;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
