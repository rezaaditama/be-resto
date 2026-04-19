-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_orders_id_fkey";

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
