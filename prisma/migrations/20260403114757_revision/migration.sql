/*
  Warnings:

  - Added the required column `category` to the `menus` table without a default value. This is not possible if the table is not empty.
  - Made the column `stock` on table `menus` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_available` on table `menus` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `status` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "order_status" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_menu_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "category" "category" NOT NULL,
ALTER COLUMN "stock" SET NOT NULL,
ALTER COLUMN "is_available" SET NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "expired_at" TIMESTAMP(6),
ADD COLUMN     "status" "order_status" NOT NULL;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
