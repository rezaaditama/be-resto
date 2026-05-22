import cron from "node-cron";
import prisma from "../lib/prisma";
import { updateCancelOrderService } from "../services/order-service/order.service";

// cron job to check expired orders
export const initOrderCronJobs = () => {

    // cron job every 1 minute
    cron.schedule("* * * * *", async () => {
        
        // get current timestamp    
        const cronTimeStamp = new Date().toISOString();

        // log cron job started
        console.log(`[CRON SYSTEM] Running check for expired orders at: ${cronTimeStamp}`);

        // get expired orders (status pending and expired_at <= current time)
        try {
            const expiredOrders = await prisma.orders.findMany({
                where: {
                    status: "PENDING",
                    expired_at: {
                        lte: new Date()
                    }
                }, 
                select: {
                    id: true
                }
            });

            // if no expired orders, return
            if (expiredOrders.length === 0) {
                return;
            }
 
            // info expired orders
            console.log(`[CRON SYSTEM] Found ${expiredOrders.length} expired order(s) to process.`);

            // process each expired order
            for (const order of expiredOrders) {
                try {
                    await updateCancelOrderService(order.id);
                    console.log(`[CRON SYSTEM] Order ${order.id} has been cancelled.`);
                } catch (serviceError: any) {
                    console.error(`[CRON SYSTEM] Failed to cancel order ${order.id}:`, serviceError.message);
                }
            }

        } catch (error: any) {
            console.error("[CRON FATAL ERROR] System failed to query expired orders:", error);
        }
    })
}