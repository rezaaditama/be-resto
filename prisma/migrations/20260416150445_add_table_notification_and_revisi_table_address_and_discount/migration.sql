/*
  Warnings:

  - You are about to drop the column `description` on the `discount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "discount" DROP COLUMN "description",
ADD COLUMN     "discount_name" VARCHAR(255),
ADD COLUMN     "end_date" TIMESTAMP(6),
ADD COLUMN     "star_date" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "order_id" TEXT NOT NULL,
    "target_role" "role",
    "tittle" VARCHAR(255) NOT NULL,
    "message" VARCHAR(225),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "payments_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
