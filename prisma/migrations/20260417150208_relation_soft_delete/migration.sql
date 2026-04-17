/*
  Warnings:

  - You are about to drop the column `is_validate` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `star_date` on the `discount` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `notifications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_customer_id_fkey";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "is_validate",
ADD COLUMN     "is_validated" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "discount" DROP COLUMN "star_date",
ADD COLUMN     "start_date" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "customer_id";

-- RenameForeignKey
ALTER TABLE "notifications" RENAME CONSTRAINT "payments_orders_id_fkey" TO "notifications_order_id_fkey";
