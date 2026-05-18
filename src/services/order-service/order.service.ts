import { generateOrderIdentity } from "../../utils/orderGenerator";
import prisma from "../../lib/prisma";
import { CreateOrderInput } from "../../schemas/order.schemas";
import { AppError } from "../../utils/appError";
import { calculateDiscount, calculateGrandTotal, calculateSubTotal, calculateTax } from "../../utils/orderPriceCalculation";
import { order_status, role } from "../../../generated/prisma";

// create order service
export const createOrderService = async (data: CreateOrderInput, userId?: string, userRole?: string) => {

    // validate order source
    if (userRole === "GUEST" && data.source !== "QR_SCAN") {
        throw new AppError("Guest hanya diizinkan melalui QR Scan", 403);
    };

    // initialize table_id and address_id
    let tableId: number | null = null;
    let addressId: string | null = null;

    // get table_id or address_id from data
    if (data.source === "ONLINE") {
        addressId = data.address_id;
    } else {
        tableId = data.table_id;
    };

    // prisma transaction
    return await prisma.$transaction(async (tx) => {

        // if user is correct
        if (userRole === "CUSTOMER") {
            const customer = await tx.customers.findUnique({
                where: {id: userId, is_validated: true}
            });

            if (!customer) {
                throw new AppError("Akun customer tidak ditemukan", 404);
            };
        } else if (["KIOSK_SYSTEM", "CASHIER", "WAITER"].includes(userRole || "")) {
            const staff = await tx.staff.findUnique({
                where: {id: userId, is_active: true}
            });

            if (!staff) {
                throw new AppError("Staff tidak aktif/tidak ditemukan", 404);
            };
        };

        // if table exist
        if (tableId) {
            const table = await tx.tables.findUnique({
                where: {id: tableId}
            });

            if (!table) {
                throw new AppError(`Nomor meja ${tableId} tidak ditemukan atau tidak tersedia`, 404);
            };
        };

        // check if address exist
        if (addressId && userRole === "CUSTOMER") {
            const address = await tx.address.findFirst({
                where: {id: addressId, customer_id: userId}
            });

            if (!address) {
                throw new AppError(`Alamat tidak ditemukan`, 404);
            };
        };

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
                notes: item.notes ?? null,
                sub_total: subTotal
            };
        });

        // discount variable value
        let discountAmount = 0;
        let finalDiscountId: number | null = null;

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
            const calc = calculateDiscount(totalAmount, discount.value.toNumber());
            discountAmount = calc.discountAmount;
            finalDiscountId = data.discount_id;
        };

        // calculate amount after discount
        const amountAfterDiscount = totalAmount - discountAmount;

        // calculate tax
        const taxAmount = calculateTax(amountAfterDiscount);

        // calculate grand total
        const grandTotal = calculateGrandTotal(amountAfterDiscount, taxAmount, uniqueCode);

        // mapping user id
        let staffId: string | null = null;
        let customerId: string | null = null;

        if (userRole === "CUSTOMER") {
            customerId = userId || null;
        } else if (["KIOSK_SYSTEM", "CASHIER", "WAITER"].includes(userRole || "")) {
            staffId = userId || null;
        };

        // create message preview
        const messagePreview = data.order_items.map(item => {
            const menuName = menus.find(m => m.id === item.menu_id)?.name;
            return `${item.quantity}x ${menuName}`;
        }).join(", ");

        // create order
        const order = await tx.orders.create({
            data: {
                id: orderId,
                table_id: tableId,
                staff_id: staffId,
                customer_id: customerId,
                discount_id: finalDiscountId,
                address_id: addressId,
                source: data.source,
                status: 'PENDING',
                total_amount: totalAmount,
                discount_amount: discountAmount,
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
        if (tableId) {
            await tx.tables.update({
                where: {
                    id: tableId
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

export const validatePaymentService = async (orderId: string, bankName: string) => {

    // prisma transaction
    return await prisma.$transaction(async (tx) => {

        // find order
        const order = await tx.orders.findUnique({
            where: {
                id: orderId,
                status: 'PENDING'
            }
        });

        // if order not found
        if (!order) {
            throw new AppError("Pesanan tidak ditemukan", 404);
        };

        // if order already validated
        if (order.status !== "PENDING") {
            throw new AppError("Pesanan sudah divalidasi", 400);
        };

        // if order expired
        if (order.expired_at && order.expired_at < new Date()) {
            await tx.orders.update({
                where: {
                    id: orderId,
                    status: "PENDING"
                },
                data: {
                    status: "CANCELED",
                }
            });
            throw new AppError("Pesanan sudah kadaluarsa", 400);
        };

        // get order type and time
        const orderType = order.source === "ONLINE" ? "Delivery" : "Dine In";
        const orderTime = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});

        // create payment data
        await tx.payments.create({
            data: {
                order_id: orderId,
                amount_paid: order.grand_total_amount,
                bank_name: bankName,
            }
        });

        // update order & create notifications
        const updatedOrder = await tx.orders.update({
            where: {
                id: orderId
            },
            data: {
                status: "VALIDATED",
                validated_at: new Date(),
                notifications: {
                    createMany: {
                        data: [
                            {
                                target_role: null,
                                tittle: "Pesanan sedang disiapkan",
                                message: "Dapur telah menerima pesanan Anda. Hidangan Anda sedang disiapkan dengan sepenuh hati.",
                                is_read: false,
                            },
                            {
                                target_role: "KITCHEN",
                                tittle: "Pesanan Masuk",
                                message: `Pesanan ${orderId}, waktu ${orderTime}, ${orderType}`,
                                is_read: false,
                            }
                        ],
                    },
                }
            }
        });

        // update notification status
        await tx.notifications.updateMany({
            where: {
                order_id: orderId,
                target_role: "CASHIER",
                is_read: false,
            },
            data: {
                is_read: true,
                updated_at: new Date(),
            }
        });

        return updatedOrder;
    });
};

// helper function to update order status
export const updateOrderStatusHelper = async (orderId: string, fromStatus: order_status, toStatus: order_status, newNotification: {tittle: string, message: string, target_role: role | null}[] = []) => {
  
    // prisma transaction
    return await prisma.$transaction(async (tx) => {
        
        // find order
        const order = await tx.orders.findUnique({
            where: {id: orderId, status: fromStatus}
        });

        // if order not found
        if (!order) {
            throw new AppError("Pesanan tidak ditemukan", 404);
        };

        // mapping timestamp
        const timestampField: Record<string, string> = {
            'COOKING': "cooking_started_at",
            "READY": "ready_at",
            "COMPLETED": "completed_at"
        };

        // update order status and create notifications
        const updatedOrder = await tx.orders.update({
            where: {id: orderId, status: fromStatus},
            data: {
                status: toStatus,
                [timestampField[toStatus]]: new Date(),
                notifications: {
                    createMany: {
                        data: newNotification.map(n => ({...n, is_read: false}))
                    }
                }
            }
        });

        // mapping roles to clear notification
        let rolesToClear: role[] = [];
        if ((fromStatus === "VALIDATED" && toStatus === "COOKING") || (fromStatus === "COOKING" && toStatus === "READY")) {
            rolesToClear.push("KITCHEN");
        };

        if (fromStatus === "READY" && toStatus === "COMPLETED") {
            rolesToClear.push("WAITER");
        };

        // update notification status
        if (rolesToClear.length > 0) {
            await tx.notifications.updateMany({
                where: {
                    order_id: orderId,
                    target_role: {
                        in: rolesToClear
                    },
                    is_read: false
                },
                data: {
                    is_read: true,
                    updated_at: new Date(),
                }
            });
        };

        // update table status if order status completed
        if (updatedOrder.table_id && toStatus === "COMPLETED" && fromStatus === "READY") {
            await tx.tables.update({
                where: {id: updatedOrder.table_id},
                data: {status: "DIRTY"}
            });
        };

        // return updated order
        return updatedOrder;
    });
};

// start cooking service
export const startCookingService = async (orderId: string) => {
    return await updateOrderStatusHelper(orderId, "VALIDATED", "COOKING")
};

// ready service
export const readyService = async (orderId: string) => {

    // get order items details
    const orderItems = await prisma.order_items.findMany({
        where: {order_id: orderId},
        include: {
            menu: {
                select: {name: true}
            }
        }
    });

    // mapping order items
    const orderItemsList = orderItems.map(item => `${item.quantity}x ${item.menu!.name}`).join(", ");


    // return notification
    return await updateOrderStatusHelper(orderId, "COOKING", "READY", [
        {
            target_role: "WAITER",
            tittle: "Pesanan siap diantar",
            message: orderItemsList
        },
        {
            target_role: null,
            tittle: "Pesanan sedang diantar",
            message: "Kabar baik! Kurir sedang dalam perjalanan menuju lokasi Anda."
        }
    ]);
};

// complete service
export const completeService = async (orderId: string) => {
    const result = await updateOrderStatusHelper(orderId, "READY", "COMPLETED");

    // return result
    return result;
}