import cron from "node-cron";
import prisma from "../lib/prisma";


// cron job to check expired discounts
export const initDiscountCronJobs = () => {

    // cron job running every 00.00
    cron.schedule("0 0 * * *", async () => {
        
        // get current timestamp
        const cronTimeStamp = new Date().toISOString();

        // log cron job started
        console.log(`[CRON SYSTEM] Running check for expired discounts at: ${cronTimeStamp}`);

        // get expired discounts (status active and end_date <= current time)
        try {
            
            // get today midnight
            const today = new Date();
            const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            // get expired discounts
            await prisma.$transaction(async (tx) => {

                // get expired discounts
                const expiredDiscount = await tx.discount.updateMany({
                    where: {

                        // end date < current date
                        end_date: {
                            lt: currentDate
                        },

                        // status active
                        is_active: true
                    },

                    // set inactive
                    data: {
                        is_active: false
                    }
                });

                // log expired discounts
                console.log(`[CRON SYSTEM] Found ${expiredDiscount.count} expired discount(s) to process.`);
            
                // get active discounts
                const activeDiscount = await tx.discount.updateMany({
                    where: {

                        // start date <= current date
                        start_date: {
                            lte: currentDate
                        },

                        // end date >= current date or end date is null
                        OR: [
                            { end_date: { gte: currentDate } },
                            { end_date: null }
                        ],
                        is_active: false
                    },

                    // set active
                    data: {
                        is_active: true
                    }
                });

                // log active discounts
                console.log(`[CRON SYSTEM] Found ${activeDiscount.count} active discount(s) to process.`);
            
            });

            // log cron job finished
            console.log(`[CRON SYSTEM] Successfully processed discounts at: ${new Date().toISOString()}`);

        } catch (error: any) {
            console.error(`[CRON SYSTEM] Error processing discounts: ${error.message}`);
        };

    });
};