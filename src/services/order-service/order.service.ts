import { generateOrderIdentity } from "../../utils/orderGenerator";
import prisma from "../../lib/prisma";
import { CreateOrderInput } from "./order.schemas";
import { AppError } from "../../utils/appError";
import { calculateDiscount, calculateGrandTotal, calculateSubTotal, calculateTax } from "../../utils/orderPriceCalculation";
import { order_status, role } from "../../../generated/prisma";

// create order service
export const createOrderService = async (data: CreateOrderInput, userId?: string, userRole?: string) => {

    // mapping role to source
    const roleSourceMatrix: Record<string, string> = {
        "CUSTOMER": "ONLINE",
        "GUEST": "QR_SCAN",
        "KIOSK_SYSTEM": "KIOSK",
        "CASHIER": "CASHIER",
        "WAITER": "WAITER"
    };

    // get expected source from role
    const expectedSource = roleSourceMatrix[userRole || ""];

    // validate order source
    if (!expectedSource || data.source !== expectedSource) {
        throw new AppError(`Akses ilegal. Akun dengan role '${userRole}' hanya diizinkan membuat pesanan melalui jalur '${expectedSource}'`, 403);
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

            // initialize date now
            const dateNow = new Date();
            const currentTimestamp = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate());

            // check if discount is not found
            if (
                !discount || 
                !discount.is_active || 
                (discount.end_date !== null && discount.end_date < currentTimestamp) || 
                (discount.start_date !== null && discount.start_date > currentTimestamp)
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
                    createMany: {
                        data: [
                            {
                                target_role: null,
                                tittle: "Pesanan Berhasil, Menunggu validasi.",
                                message: "Pesanan Berhasil di Pesan, Menunggu Validasi Pembayaran.",
                                is_read: false,
                            },
                            {
                                target_role: "CASHIER",
                                tittle: "Validasi Pembayaran",
                                message: messagePreview.length > 100 ? messagePreview.substring(0, 97) + '...' : messagePreview,
                                is_read: false,
                            }
                        ],
                    },
                    // create: {
                    //     target_role: "CASHIER",
                    //     tittle: "Validasi Pembayaran",
                    //     message: messagePreview.length > 100 ? messagePreview.substring(0, 97) + '...' : messagePreview,
                    //     is_read: false,
                    // }
                }
            },
            include: {
                table: {
                    select: {
                        table_number: true
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
export const completedService = async (orderId: string) => {
    const result = await updateOrderStatusHelper(orderId, "READY", "COMPLETED");

    // return result
    return result;
};

// get order by status service
export const getOrdersByStatusService = async (statusList: order_status[], startOfDay: Date, endOfDay: Date) => {
    
    // find order by status
    return await prisma.orders.findMany({
        where: {
            status: {
                in: statusList
            },
            created_at: {
                gte: startOfDay,
                lte: endOfDay
            }
        },

        // include field order items and table
        include: {
            order_items: {
                include: {
                    menu: {
                        select: {
                            name: true
                        }
                    }
                }
            },

            // include table
            table: {
                select: {
                    table_number: true
                }
            }
        },

        // order by created at ascending
        orderBy: {
            created_at: "desc"
        }
    })
}

// get order by id service
export const getOrderByIdService = async (orderId: string) => {

    // find order by id
    const order = await prisma.orders.findUnique({
        where: {
            id: orderId
        },
        include: {
            table: {
                select: {
                    table_number: true
                }
            },
            order_items: {
                include: {
                    menu: {
                        select: {
                            name: true,
                            price: true
                        }
                    }
                },                
            },
            payments: true,
            discount: true,
            address: true
        }
    });

    // if order not found
    if (!order) {
        throw new AppError("Pesanan tidak ditemukan", 404);
    };

    // return order
    return order;
};

// get all my order service
export const getAllMyOrderService = async (userId: string) => {

    // get all order by user id
    return await prisma.orders.findMany({
        where: {
            customer_id: userId
        },
        include: {
            order_items: {
                include: {
                    menu: {
                        select: {
                            name: true
                        }
                    }
                }
            },
        },

        // order by created at ascending
        orderBy: {
            created_at: "desc"
        }
    });
};

// get report order service
export const getReportOrderService = async (date: string) => {

    // initialize date
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // execute query pararel
    const [financialSummary, rawTransactions] = await Promise.all([

        // get total sales and total order
        prisma.orders.aggregate({

            // filter by date and status completed
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                },
                status: "COMPLETED"
            },

            // sum grand total amount
            _sum: {
                grand_total_amount: true
            },

            // count total order
            _count: {
                id: true
            }
        }),

        // get all transaction
      prisma.orders.findMany({

        // filter by date and status completed
        where: {
            created_at: {
                gte: startDate,
                lte: endDate
            },
            status: "COMPLETED"
        },

        // select field
        select: {
            id: true,
            created_at: true,
            grand_total_amount: true,
            order_items: {
                select: {
                    quantity: true,
                    menu: {
                        select: {
                            name: true,
                            category: true
                        }
                    }
                }
            },
            payments: {
                select: {
                    bank_name: true
                },
                take: 1
            }
        },

        // order by created at descending
        orderBy: {
            created_at: "desc"
        }
      })
    ]);

    // format transaction
    const formattedTransactions = rawTransactions.map((order) => {

        // initialize foods and drinks array
        const foods: any[] = [];
        const drinks: any[] = [];

        // mapping order items
        order.order_items.forEach((item) => {

            // initialize item data
            const itemData = {
                name: item.menu!.name,
                quantity: item.quantity
            };

            // push item data to foods or drinks array
            if (item.menu!.category === "FOOD") {
                foods.push(itemData);
            } else if (item.menu!.category === "DRINK") {
                drinks.push(itemData);
            };
        });

        // return formatted transaction
        return {
            order_id: order.id,
            create_at: order.created_at,
            grand_total_amount: order.grand_total_amount,
            payment_method: order.payments[0]?.bank_name ?? "BCA",
            order_items: {
                foods,
                drinks
            }
        };
    });

    // return result
    return {
        selectedDate: date,
        summary: {
            totalOrder: financialSummary._count.id || 0,
            totalSales: Number(financialSummary._sum.grand_total_amount) || 0
        },
        transactions: formattedTransactions
    };
};

export const updateCancelOrderService = async (orderId: string) => {

    // prisma transaction
    return await prisma.$transaction(async (tx) => {

        // get order by id
        const order = await tx.orders.findUnique({
            where: {
                id: orderId
            },
            include: {
                order_items: true
            }
        });

        // if order not found
        if (!order || order.status !== "PENDING") {
            throw new AppError("Pesanan tidak ditemukan atau sudah dibatalkan", 404);
        };

        // update order status
       const updateOrder = await tx.orders.update({
        where: {
            id: orderId
        },
        data: {
            status: "CANCELED"
        }
       });

    // update table status from not available to available
    if (order.table_id) {
        await tx.tables.update({
            where: {
                id: order.table_id
            },
            data: {
                status: "AVAILABLE"
            }
        });
    };

    // update stock menu
    await Promise.all(
        order.order_items.map(async (item) => {

            // if menu id is not null
            if (item.menu_id) {
                const updateStockMenu = await tx.menus.update({
                    where: {
                        id: item.menu_id
                    },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                })

                // if menu available
                if (updateStockMenu.stock !== null && !updateStockMenu.is_available && updateStockMenu.stock > 0) {
                    await tx.menus.update({
                        where: {
                            id: item.menu_id
                        },
                        data: {
                            is_available: true
                        }
                    });
                };
            };
        })
    );

    // return result
    return updateOrder;

    });
};

// get substitute menus service (for dropdown)
export const getSubstituteMenusService = async (targetPrice: number, currentMenuId: string) => {
    
    // find available menus with the exact same price
    return await prisma.menus.findMany({
        where: {
            price: targetPrice,
            id: { not: currentMenuId },
            is_available: true,
            deleted_at: null // ensure menu is not deleted
        },
        select: {
            id: true,
            name: true,
            price: true,
            category: true
        },
        orderBy: {
            name: "asc"
        }
    });
};

// swap order item service (tukar menu dengan harga sama)
export const swapOrderItemService = async (orderId: string, orderItemId: string, newMenuId: string, qtyToSwap: number, newNotes?: string) => {
    
    // prisma transaction
    return await prisma.$transaction(async (tx) => {
        
        // find order and include its items
        const order = await tx.orders.findUnique({
            where: { id: orderId },
            include: {
                order_items: {
                    include: { menu: true }
                }
            }
        });

        // if order not found
        if (!order) {
            throw new AppError("Pesanan tidak ditemukan", 404);
        }

        // if order cannot be modified
        if (order.status === "CANCELED" || order.status === "COMPLETED") {
            throw new AppError(`Akses ditolak! Pesanan yang sudah ${order.status} tidak bisa diubah`, 400);
        }

        // find the specific order item
        const oldOrderItem = order.order_items.find(item => item.id === orderItemId);
        
        if (!oldOrderItem) {
            throw new AppError("Detail pesanan tidak ditemukan di dalam order ini", 404);
        }

        // validate swap quantity
        if (qtyToSwap <= 0 || qtyToSwap > oldOrderItem.quantity) {
            throw new AppError("Kuantitas tukar tidak valid", 400);
        }

        // find the new menu
        const newMenu = await tx.menus.findUnique({
            where: { id: newMenuId, deleted_at: null }
        });

        // validate new menu availability
        if (!newMenu) {
            throw new AppError("Menu pengganti tidak ditemukan", 404);
        }
        if (!newMenu.is_available) {
            throw new AppError(`Menu ${newMenu.name} saat ini tidak tersedia`, 400);
        }
        if (newMenu.stock !== null && newMenu.stock < qtyToSwap) {
            throw new AppError(`Stock ${newMenu.name} tidak cukup`, 400);
        }

        // CRITICAL: validate price must be exactly the same
        if (newMenu.price.toNumber() !== oldOrderItem.menu!.price.toNumber()) {
            throw new AppError("Akses ditolak! Harga menu pengganti harus sama persis", 400);
        }

        // === UPDATE STOCK LOGIC ===
        
        // return old menu stock
        if (oldOrderItem.menu_id) {
            const updateStockOldMenu = await tx.menus.update({
                where: { id: oldOrderItem.menu_id },
                data: { stock: { increment: qtyToSwap } }
            });

            // if old menu was marked unavailable but now has stock (logic safety)
            if (updateStockOldMenu.stock !== null && !updateStockOldMenu.is_available && updateStockOldMenu.stock > 0) {
                await tx.menus.update({
                    where: { id: oldOrderItem.menu_id },
                    data: { is_available: true }
                });
            }
        }

        // deduct new menu stock
        const updateStockNewMenu = await tx.menus.update({
            where: { id: newMenuId },
            data: { stock: { decrement: qtyToSwap } }
        });

        // if new menu stock hits 0, set to unavailable
        if (updateStockNewMenu.stock !== null && updateStockNewMenu.stock <= 0) {
            await tx.menus.update({
                where: { id: newMenuId },
                data: { is_available: false }
            });
        }

        // === SWAP LOGIC ===
        
        // check if the new menu already exists in this order (to merge)
        const existingNewItem = order.order_items.find(item => item.menu_id === newMenuId);
        
        // calculate subtotal for the swapped amount
        const swappedSubTotal = calculateSubTotal(newMenu.price.toNumber(), qtyToSwap);

        // scenario A: Full swap
        if (qtyToSwap === oldOrderItem.quantity) {
            if (existingNewItem) {
                // merge to existing item
                await tx.order_items.update({
                    where: { id: existingNewItem.id },
                    data: {
                        quantity: existingNewItem.quantity + qtyToSwap,
                        sub_total: existingNewItem.sub_total.toNumber() + swappedSubTotal
                    }
                });
                // delete the old item
                await tx.order_items.delete({
                    where: { id: orderItemId }
                });
            } else {
                // simply change menu_id
                await tx.order_items.update({
                    where: { id: orderItemId },
                    data: { menu_id: newMenuId, 
                        notes: newNotes || null 
                    }
                });
            }
        } 
        // scenario B: Partial swap (Split item)
        else {
            const remainingQty = oldOrderItem.quantity - qtyToSwap;
            const remainingSubTotal = calculateSubTotal(oldOrderItem.menu!.price.toNumber(), remainingQty);

            // update old item's remaining quantity
            await tx.order_items.update({
                where: { id: orderItemId },
                data: {
                    quantity: remainingQty,
                    sub_total: remainingSubTotal
                }
            });

            if (existingNewItem) {
                // merge the swapped qty to existing replacement item
                await tx.order_items.update({
                    where: { id: existingNewItem.id },
                    data: {
                        quantity: existingNewItem.quantity + qtyToSwap,
                        sub_total: existingNewItem.sub_total.toNumber() + swappedSubTotal
                    }
                });
            } else {
                // create a new row for the swapped item
                await tx.order_items.create({
                    data: {
                        order_id: orderId,
                        menu_id: newMenuId,
                        quantity: qtyToSwap,
                        sub_total: swappedSubTotal,
                        notes: newNotes || null // bring the old notes (e.g., "less sugar")
                    }
                });
            }
        }

        // return updated order
        return await tx.orders.findUnique({
            where: { id: orderId },
            include: {
                table: { select: { table_number: true } },
                order_items: {
                    include: {
                        menu: {
                            select: { name: true, price: true }
                        }
                    }
                }
            }
        });

    });
};

// remove/void order item service
export const removeOrderItemService = async (orderId: string, orderItemId: string) => {
    
    return await prisma.$transaction(async (tx) => {
        
        // 1. Cari pesanan induk dan itemnya
        const order = await tx.orders.findUnique({
            where: { id: orderId },
            include: { order_items: true }
        });

        if (!order) throw new AppError("Pesanan tidak ditemukan", 404);

        if (order.status === "CANCELED" || order.status === "COMPLETED") {
            throw new AppError(`Akses ditolak! Pesanan yang sudah ${order.status} tidak bisa diubah`, 400);
        }

        // 2. Cari spesifik item yang mau dihapus
        const targetItem = order.order_items.find(item => item.id === orderItemId);
        
        if (!targetItem) {
            throw new AppError("Detail pesanan tidak ditemukan di dalam nota ini", 404);
        }

        // 3. Kembalikan stok menu yang dihapus ke dapur
        if (targetItem.menu_id) {
            const updatedMenu = await tx.menus.update({
                where: { id: targetItem.menu_id },
                data: { stock: { increment: targetItem.quantity } }
            });

            // Nyalakan is_available jika sebelumnya habis
            if (updatedMenu.stock !== null && !updatedMenu.is_available && updatedMenu.stock > 0) {
                await tx.menus.update({
                    where: { id: targetItem.menu_id },
                    data: { is_available: true }
                });
            }
        }

        // 4. Hapus item dari database
        await tx.order_items.delete({
            where: { id: orderItemId }
        });

        // 5. Ambil sisa item yang masih ada di nota
        const remainingItems = await tx.order_items.findMany({
            where: { order_id: orderId }
        });

        // --- SKENARIO JIKA SEMUA ITEM DIHAPUS ---
        if (remainingItems.length === 0) {
            // Batalkan pesanan dan kosongkan meja otomatis
            if (order.table_id) {
                await tx.tables.update({
                    where: { id: order.table_id },
                    data: { status: "AVAILABLE" }
                });
            }
            const canceledOrder = await tx.orders.update({
                where: { id: orderId },
                data: { status: "CANCELED", total_amount: 0, tax_amount: 0, discount_amount: 0, grand_total_amount: 0 }
            });

            // Sinkronisasi payment menjadi 0 karena pesanan total dibatalkan
            await tx.payments.updateMany({
                where: { order_id: orderId },
                data: { amount_paid: 0 }
            });

            return canceledOrder;
        }

        // --- SKENARIO MENGHITUNG ULANG NOTA ---
        let newTotalAmount = remainingItems.reduce((sum, item) => sum + item.sub_total.toNumber(), 0);
        let newDiscountAmount = 0;
        let finalDiscountId = order.discount_id;

        // Cek apakah diskon masih berlaku setelah total harga turun
        if (order.discount_id) {
            const discount = await tx.discount.findUnique({ where: { id: order.discount_id } });
            
            // Amankan nilai null dengan menjadikannya 0 jika kosong
            const minPurchaseRequirement = discount?.min_purches ? discount.min_purches.toNumber() : 0;
            
            if (discount && newTotalAmount >= minPurchaseRequirement) {
                const calc = calculateDiscount(newTotalAmount, discount.value.toNumber());
                newDiscountAmount = calc.discountAmount;
            } else {
                // Hapus diskon jika tidak memenuhi syarat minimal pembelian lagi
                finalDiscountId = null; 
            }
        }

        // Kalkulasi ulang Pajak dan Grand Total
        const newAmountAfterDiscount = newTotalAmount - newDiscountAmount;
        const newTaxAmount = calculateTax(newAmountAfterDiscount);
        const uniqueCode = parseInt(orderId.slice(-3));
        const newGrandTotal = calculateGrandTotal(newAmountAfterDiscount, newTaxAmount, uniqueCode);

        // Update nota dengan harga baru
        const updatedOrder = await tx.orders.update({
            where: { id: orderId },
            data: {
                total_amount: newTotalAmount,
                discount_id: finalDiscountId,
                discount_amount: newDiscountAmount,
                tax_amount: newTaxAmount,
                grand_total_amount: newGrandTotal
            },
            include: {
                order_items: { include: { menu: { select: { name: true, price: true } } } }
            }
        });

        // SINKRONISASI TABEL PAYMENTS
        // Kita pakai updateMany agar tidak error jika pelanggan belum bayar (belum ada di tabel payments)
        await tx.payments.updateMany({
            where: { order_id: orderId },
            data: { amount_paid: newGrandTotal }
        });

        return updatedOrder;
    });
};