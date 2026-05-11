import { generateOrderIdentity } from "../../utils/orderGenerator";
import prisma from "../../lib/prisma";
import { CreateOrderInput } from "../../schemas/order.schemas";
import { AppError } from "../../utils/appError";
import { calculateDiscount, calculateGrandTotal, calculateSubTotal, calculateTax } from "../../utils/orderPriceCalculation";

// create order service
export const createOrderService = async (data: CreateOrderInput, userId?: string, userRole?: string) => {

    // validate order source
    if (userRole === "GUEST") {

        // if source is not QR_SCAN
        if (data.source !== "QR_SCAN") {
            throw new AppError("Guest hanya diizinkan menggunakan source QR_SCAN", 403);
        }

        // if table_id is null
        if (!data.table_id) {
            throw new AppError("Nomor meja wajib ada untuk pesanan QR Scan", 400);
        }
    };

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
        let staffId: string | null = null;
        let customerId: string | null = null;

        if (userRole === "GUEST") {
            staffId = null;
            customerId = null;
        } else if (["KIOSK_SYSTEM", "CASHIER", "WAITER"].includes(userRole || "")) {
            staffId = userId || null;
            customerId = null;
        } else if (userRole === "CUSTOMER") {
            staffId = null;
            customerId = userId || null;
        } else {
            throw new AppError("Role user tidak ditemukan", 404);
        }

        // create message preview
        const messagePreview = data.order_items.map(item => {
            const menuName = menus.find(m => m.id === item.menu_id)?.name;
            return `${item.quantity}x ${menuName}`;
        }).join(", ");

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
                        tittle: "Validasi Pembayaran",
                        message: messagePreview.length > 100 ? messagePreview.substring(0, 97) + '...' : messagePreview,
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