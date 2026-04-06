/*
  Warnings:

  - The values [CANCELLED] on the enum `order_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `menus` table. All the data in the column will be lost.
  - The primary key for the `orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `customer_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `staff_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `created_at` on table `menus` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `menus` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `discount_amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grand_total_amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax_amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Made the column `order_number` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `tables` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `tables` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'CASHIER', 'WAITER', 'KIOSK_SYSTEM', 'KITCHEN', 'CUSTOMER');

-- AlterEnum
BEGIN;
CREATE TYPE "order_status_new" AS ENUM ('CANCELED', 'PENDING', 'VALIDATED', 'COOKING', 'READY', 'COMPLETED');
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "order_status_new" USING ("status"::text::"order_status_new");
ALTER TYPE "order_status" RENAME TO "order_status_old";
ALTER TYPE "order_status_new" RENAME TO "order_status";
DROP TYPE "public"."order_status_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_menu_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_staff_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_orders_id_fkey";

-- AlterTable
ALTER TABLE "menus" DROP COLUMN "category",
ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "is_available" DROP NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "order_id" SET DATA TYPE TEXT;

-- AlterTable
CREATE SEQUENCE orders_order_number_seq;
ALTER TABLE "orders" DROP CONSTRAINT "orders_pkey",
DROP COLUMN "customer_id",
DROP COLUMN "discount",
DROP COLUMN "staff_id",
ADD COLUMN     "discount_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "discount_id" INTEGER,
ADD COLUMN     "grand_total_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "tax_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "taxes_id" INTEGER,
ADD COLUMN     "user_id" UUID,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "order_number" SET NOT NULL,
ALTER COLUMN "order_number" SET DEFAULT nextval('orders_order_number_seq'),
ALTER COLUMN "created_at" SET NOT NULL,
ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
ALTER SEQUENCE orders_order_number_seq OWNED BY "orders"."order_number";

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "order_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
CREATE SEQUENCE tables_id_seq;
ALTER TABLE "tables" ALTER COLUMN "id" SET DEFAULT nextval('tables_id_seq'),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER SEQUENCE tables_id_seq OWNED BY "tables"."id";

-- DropTable
DROP TABLE "customers";

-- DropTable
DROP TABLE "staff";

-- DropEnum
DROP TYPE "staff_role";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "address" TEXT,
    "otp_code" INTEGER,
    "role" "role" NOT NULL,
    "gender" "gender_option",
    "date_of_birth" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "otp_validated_at" TIMESTAMP(6),
    "otp_expired_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount" (
    "id" SERIAL NOT NULL,
    "discount_code" VARCHAR(10) NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(10) NOT NULL,
    "rate" INTEGER NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "discount_discount_code_key" ON "discount"("discount_code");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_taxes_id_fkey" FOREIGN KEY ("taxes_id") REFERENCES "taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
