import prisma from "../lib/prisma";

// generate order_id and order_number
export const generateOrderIdentity = async () => {

    //  get date
    const dateNow = new Date();

    // format date to YYMMDD
    const datePrefix = dateNow.toISOString().slice(2, 10).replace(/-/g, '');

    // get last order number
    const lastOrderNumber = await prisma.orders.findFirst({
        where: {
            id: {
                startsWith: datePrefix
            }
        },
        orderBy: {
            order_number: 'desc'
        },
        select: {
            order_number: true
        }
    });

    // Get next order number
    const nextOrderNumber = lastOrderNumber ? lastOrderNumber.order_number + 1 : 1;

    // create unique code from 3 digit order number
    const uniqueCode = nextOrderNumber.toString().padStart(3, "0")

    // create order_id
    const orderId = `${datePrefix}${uniqueCode}`;

    // return order_id and order_number
    return {
        orderId,
        orderNumber: nextOrderNumber,
        uniqueCode: parseInt(uniqueCode.slice(-3))
    }
}