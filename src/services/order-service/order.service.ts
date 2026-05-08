import { generateOrderIdentity } from "../../utils/orderGenerator";
import prisma from "../../lib/prisma";
import { CreateOrderSchema } from "../../schemas/order.schemas";
import { AppError } from "../../utils/appError";
import { calculateDiscount, calculateGrandTotal, calculateSubTotal, calculateTax } from "../../utils/orderPriceCalculation";

// create order service
export const createOrderService = async (data: CreateOrderSchema, userId: string) => {

    // prisma transaction
    return await prisma.$transaction(async (tx) => {

        // get order_id, order_number, unique_code
        const {orderId, orderNumber, uniqueCode} = await generateOrderIdentity();

        // get only menu_id from data order_items
        const menuIds = data.order_items.map(item => item.menu_id);

        // get menu_id from database equal to menuIds
        const menus = await tx.menus.findMany({
            where: {
                id: {
                    in: menuIds
                }, 
                deleted_at: null
            }
        });

        // check if menu is not found
        if (menus.length !== new Set(menuIds).size) {
            throw new AppError("Menu tidak ditemukan", 400);
        };

        // calculate sub total
        let totalAmount = 0;

        // mapping order_items data
        const orderItemsData = data.order_items.map(item => {

            // find menu_id from database equal to menuIds from data order_items
            const menu = menus.find(m => m.id === item.menu_id)

            // if menu not found and not available
            if (!menu || !menu.is_available) {
                throw new AppError(`Menu ${menu?.name || 'Unknown'} saat ini tidak tersedia`, 400);
            };

            // if stock not enough
            if (menu.stock !== null && menu.stock < item.quantity || menu.stock === 0) {
                throw new AppError(`Stock ${menu?.name} tidak cukup`, 400);
            };

            // calculate sub total
            const subTotal = calculateSubTotal(menu.price.toNumber(), item.quantity);

            // add sub total to total_amount
            totalAmount += subTotal;

            // return order_items
            return {
                menu_id: menu.id,
                quantity: item.quantity,
                notes: item.notes,
                sub_total: subTotal
            };
        });

        // discount variable value
        let discountValue = { amountAfterDiscount: totalAmount, discountAmount: 0 };

        // check if discount_id is not null
        if (data.discount_id) {
            // find discount_id from database
            const discount = await tx.discount.findUnique({
                where: {
                    id: data.discount_id
                }
            });

            // check if discount is not found
            if (
                !discount || 
                !discount.is_active || 
                (discount.end_date !== null && discount.end_date < new Date()) || 
                (discount.start_date !== null && discount.start_date > new Date())
            ) {
                throw new AppError('Diskon tidak ditemukan atau tidak aktif', 400);
            };

            // if min_purchase not met
            if (discount.min_purches && totalAmount < discount.min_purches.toNumber()) {
                throw new AppError(`Minimal pembelian Rp${discount.min_purches} untuk diskon ini`, 400);
            };

            // calculate discount amount
            discountValue = calculateDiscount(totalAmount, discount.value.toNumber());
        };

        // calculate tax
        const taxAmount = calculateTax(discountValue.amountAfterDiscount);

        // calculate grand total
        const grandTotal = calculateGrandTotal(discountValue.amountAfterDiscount, taxAmount, uniqueCode);

        // mapping user id
        const staffId = ['KIOSK', 'CASHIER', 'WAITER'].includes(data.source) ? userId : null;
        const customerId = (data.source === 'ONLINE') ? userId : (data.customer_id || null);

        // create order
        const order = await tx.orders.create({
            data: {
                id: orderId,
                table_id: data.table_id || null,
                staff_id: staffId,
                customer_id: customerId,
                discount_id: data.discount_id || null,
                address_id: data.address_id || null,
                source: data.source,
                status: 'PENDING',
                total_amount: totalAmount,
                discount_amount: discountValue.discountAmount,
                tax_amount: taxAmount,
                grand_total_amount: grandTotal,
                order_number: orderNumber,
                expired_at: new Date(Date.now() + 60 * 60 * 1000),
                order_items: {create: orderItemsData},
                notifications: {
                    create: {
                        target_role: "CASHIER",
                        tittle: "Pesanan Baru",
                        message: `Pesanan baru dengan nomor ${orderNumber} telah dibuat`,
                        is_read: false,
                    }
                }
            }
        });

        // update table status
        if (data.table_id) {
            await tx.tables.update({
                where: {
                    id: data.table_id
                },
                data: {
                    status: 'OCCUPIED'
                }
            });
        };

        // update stock menu
        await Promise.all(
            data.order_items.map(async (item) => {
                const updatedMenu = await tx.menus.update({
                    where: {
                        id: item.menu_id
                    },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });

                // if menu stock is 0 set is_available to false
                if (updatedMenu.stock !== null && updatedMenu.stock <= 0) {
                    await tx.menus.update({
                        where: {
                            id: item.menu_id
                        },
                        data: {
                            is_available: false
                        }
                    });
                }
            })
        );

        // return order
        return order;
    });
};