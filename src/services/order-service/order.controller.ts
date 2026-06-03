import { asyncHandler } from "../../utils/asyncHandler";
import { Response } from "express";
import { AuthRequest } from "../../types/auth.types";
import { createOrderSchema, getOrderByCategorySchema, getReportOrderSchema, removeOrderItemSchema, swapOrderItemSchema, validatePaymentSchema } from "./order.schemas";
import { AppError } from "../../utils/appError";
import { completedService, createOrderService, getAllMyOrderService, getOrderByIdService, getOrdersByStatusService, getReportOrderService, getSubstituteMenusService, readyService, removeOrderItemService, startCookingService, swapOrderItemService, updateCancelOrderService, validatePaymentService } from "./order.service";
import { responseSuccess } from "../../utils/response";
import { order_status } from "../../../generated/prisma";

export const createOrderController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // validate request body
    const validatedData = createOrderSchema.safeParse(req.body);

    // if validation failed
    if (!validatedData.success) {
        throw new AppError("Validasi gagal", 400, validatedData.error.flatten().fieldErrors);
    };

    // get requester id from JWT user
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;

    // if requester id not found and source is not QR_SCAN
    if (!requesterId && validatedData.data.source !== "QR_SCAN") {
        throw new AppError("Sesi tidak valid, silakan login kembali untuk membuat pesanan ini", 401);
    };  

    // create new order
    const newOrder = await createOrderService(validatedData.data, requesterId, requesterRole);

    // return response success
    return responseSuccess(
        res, 
        "Pesanan berhasil dibuat", 
        newOrder, 
        201
    );   
});

export const validatePaymentController = asyncHandler(async (req: AuthRequest, res: Response) => {

    const validatedData = validatePaymentSchema.safeParse(req.body);

    if (!validatedData.success) {
        throw new AppError("Validasi gagal", 400, validatedData.error.flatten().fieldErrors);
    };

    const {id} = req.params;

    if (typeof id !== "string") {
        throw new AppError("ID Pesanan tidak valid", 400);
    };

    const payment = await validatePaymentService(id, validatedData.data.bank_name);

    return responseSuccess(
        res,
        "Pembayaran berhasil divalidasi, pesanan akan segera dimasak",
        payment,
        200
    );

})

// start cooking controller
export const startCookingController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    // get id from params
    const { id } = req.params;

    // if id is not string
    if (typeof id !== 'string') {
        throw new AppError("ID Pesanan tidak valid", 400);
    };

    // start cooking
    const order = await startCookingService(id);
    
    // return response success
    return responseSuccess(
        res,
        "Pesanan mulai dimasak",
        order,
        200
    );
});

// set order ready controller
export const setOrderReadyController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // get id from params
    const {id} = req.params;

    // if id is not string
    if (typeof id !== 'string') {
        throw new AppError("ID pesanan tidak valid", 400);
    };

    // set order ready service
    const order = await readyService(id);

    // return response success
    return responseSuccess(
        res,
        "Pesanan siap disajikan",
        order,
        200
    );
});

//  set order complited controller
export const setOrderCompletedController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // get id from params
    const {id} = req.params;

    // if id is not string
    if (typeof id !== 'string') {
        throw new AppError("ID pesanan tidak valid", 400);
    };

    // set order complited service
    const order = await completedService(id);

    // return response success
    return responseSuccess(
        res,
        "Pesanan selesai",
        order,
        200
    );
});

// get orders by status controller
export const getOrdersByStatusController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // get user role from JWT
    const userRole = req.user!.role;

    // set target status based user role
    let targetStatus: order_status[] = [];

    // set target status based user role
    if (userRole === "CASHIER") {
        targetStatus = ["PENDING", "VALIDATED", "COOKING", "READY", "COMPLETED", "CANCELED"]
    } else if (userRole === "WAITER") {
        targetStatus = ["COOKING", "READY"]
    } else if (userRole === "KITCHEN") {
        targetStatus = ["VALIDATED", "COOKING", "READY"]
    } else {
        throw new AppError("Anda tidak memiliki akses untuk melihat pesanan", 403);
    };

    // validate query status
    const validatedQuery = getOrderByCategorySchema.safeParse(req.query);

    // if validation failed
    if (!validatedQuery.success) {
        throw new AppError("Validasi gagal", 400, validatedQuery.error.flatten().fieldErrors);
    };

    // filter status based on user role
    const finalTargetStatus = validatedQuery.data.status.filter((status) => {
        return targetStatus.includes(status);
    }) as order_status[];

    // get start of day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // get end of day
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // get order by status
    const rawOrders = await getOrdersByStatusService(finalTargetStatus, startOfDay, endOfDay);

    // format order data
    const formattedOrders = rawOrders.map(order => {

        // return formatted order
        return {
            order_id: order.id,
            order_number: order.order_number,
            table_number: order.table?.table_number ?? null,
            status: order.status,
            source: order.source,
            grand_total_amount: order.grand_total_amount,
            order_type: order.source === "ONLINE" ? "DELIVERY" : "DINE IN",
            timeStamp: (order.completed_at || order.ready_at || order.cooking_started_at || order.validated_at || order.created_at)?.toISOString(),
            items: order.order_items.map(item => ({
                menu_name: item.menu?.name,
                quantity: item.quantity,
                notes: item.notes || "Tidak ada"
            }))
        }
    });

    // return response success
    return responseSuccess(
        res, "Data pesanan berhasil diambil", formattedOrders, 200
    )
});

export const getOrderByIdController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    // get id & role from parameter
    const {id} = req.params;
    const userRole = req.user!.role;

    // if id is not string
    if (typeof id !== "string") {
        throw new AppError("ID pesanan tidak valid", 400);
    };

    // get order by id service
    const order = await getOrderByIdService(id);

    // validate user role access
    const roleAccess: Record<string, order_status[]> = {
        CASHIER: ["PENDING", "VALIDATED", "COOKING", "READY", "COMPLETED", "CANCELED"],
        WAITER: ["COOKING", "READY"],
        KITCHEN: ["VALIDATED", "COOKING", "READY"]
    };

    // if user role not have access
    if (!roleAccess[userRole]?.includes(order.status)) {
        throw new AppError("Anda tidak memiliki akses ke pesanan dengan status ini", 403);
    };

    // calculate total items
    const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);

    // base data return
    let responseData: any = {
        order_id: order.id,
        order_number: order.order_number,
        status: order.status,
        source: order.source,
        order_type: order.source === "ONLINE" ? "DELIVERY" : "DINE IN",
        total_items: totalItems,
        items: order.order_items.map(item => ({
            menu_name: item.menu!.name,
            quantity: item.quantity,
            notes: item.notes || "Tidak ada",
            price_at_transaction: `Rp${(item.sub_total.toNumber() / item.quantity).toLocaleString('id-ID')}`,
            sub_total: item.sub_total.toNumber()
        })),
        timeStamp: (order.completed_at || order.ready_at || order.cooking_started_at || order.validated_at || order.created_at)?.toISOString()
    };

    // return data cashier
    if (userRole === "CASHIER") {
        responseData = {
            ...responseData,
            payments: {
                total_amount: order.total_amount.toNumber(),
                tax_amount: order.tax_amount.toNumber(),
                discount_amount: order.discount_amount?.toNumber() ?? 0,
                unique_code: parseInt(order.id.slice(-3)),
                grand_total_amount: order.grand_total_amount.toNumber()
            }
        }
    }

    // return response success
    return responseSuccess(
        res,
        "Data pesanan berhasil di ambil",
        responseData,
        200
    )
});

export const getMyOrderByIdController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // get id from params
    const {id} = req.params;

    // get role from JWT
    const userRole = req.user!.role;

    // validate id
    if (typeof id !== "string") {
        throw new AppError("Anda tidak memiliki akses ke pesanan ini", 403);
    };

    const order = await getOrderByIdService(id);

    // validate id user or order source
    if ((order.customer_id !== req.user!.id || (order.source !== "ONLINE"))) {
        throw new AppError("Anda tidak memiliki akses ke pesanan ini", 403);
    };

    // formatted data
    const formattedData = {
        order_id: order.id,
        status: order.status,
        date: order.created_at.toDateString(),
        time: order.created_at.toTimeString(),
        order_items: order.order_items.map(item => ({
            id: item.id,
            menu_id: item.menu_id,
            menu_name: item.menu?.name || "Menu sudah tidak tersedia",
            quantity: item.quantity,
            notes: item.notes || "Tidak ada",
            price_at_transaction: item.sub_total.toNumber() / item.quantity,
        })),
        payments: {
            total_amount: order.total_amount.toNumber(),
            tax_amount: order.tax_amount.toNumber(),
            discount_amount: order.discount_amount?.toNumber() ?? 0,
            unique_code: parseInt(order.id.slice(-3)),
            grand_total_amount: order.grand_total_amount.toNumber()
        },
        address: {
            address_name: order.address?.address_name
        }
    };

    // return response success
    return responseSuccess(
        res,
        "Data pesanan berhasil di ambil",
        formattedData,
        200
    );
});

export const getMyAllOrderController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // get user id from JWT
    const userId = req.user!.id;

    // get all my order
    const orders = await getAllMyOrderService(userId);

    if (orders.length === 0) {
        throw new AppError("Anda tidak memiliki pesanan", 404);
    };

    // return response success
    return responseSuccess(
        res,
        "Data pesanan berhasil di ambil",
        orders,
        200
    );
});

// get report order controller
export const getReportOrderController = asyncHandler( async (req: AuthRequest, res: Response) => {

    // validate data
    const dataValidation = getReportOrderSchema.safeParse(req.query)

    // if data is not valid
    if (!dataValidation.success) {
        throw new AppError("Tanggal tidak valid", 400);
    };

    // if date is not provided, use today date
    const targetDate = dataValidation.data.date || new Date().toISOString().split("T")[0];

    // get report order service
    const result = await getReportOrderService(targetDate);

    // return response success
    return responseSuccess(
        res,
        `Laporan pesanan tanggal ${targetDate} berhasil di ambil`,
        result,
        200
    );
});

export const updateCancelOrderController = asyncHandler(async (req: AuthRequest, res: Response) => {

    // get id from params
    const {id} = req.params;

    // if id is not string
    if (typeof id !== "string") {
        throw new AppError("ID Pesanan tidak valid", 400);
    };

    // cancel order service
    const cancelledOrder = await updateCancelOrderService(id);

    // return response success
    return responseSuccess(
        res,
        "Pesanan berhasil dibatalkan",
        cancelledOrder,
        200
    );
});

// get substitute menus for dropdown controller
export const getSubstituteMenusController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    // ambil nilai dari query parameter (contoh URL: ?price=15000&current_menu_id=UUID-LAMA)
    const { price, current_menu_id } = req.query;

    if (!price || typeof current_menu_id !== "string") {
        throw new AppError("Parameter price (harga) dan current_menu_id (ID menu saat ini) wajib disertakan di URL", 400);
    }

    const targetPrice = parseInt(price as string);
    if (isNaN(targetPrice)) {
        throw new AppError("Format harga tidak valid", 400);
    }

    // panggil service
    const substituteMenus = await getSubstituteMenusService(targetPrice, current_menu_id);

    // return response success
    return responseSuccess(
        res,
        "Daftar menu pengganti berhasil diambil",
        substituteMenus,
        200
    );
});


// swap order item (tukar menu) controller
export const swapOrderItemController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    // 1. Ambil ID order induk dari parameter URL
    const { id: orderId } = req.params;

    if (typeof orderId !== "string") {
        throw new AppError("ID Pesanan tidak valid", 400);
    }

    // 2. Validasi body request menggunakan schema Zod terbaru kita
    const validatedData = swapOrderItemSchema.safeParse(req.body);

    if (!validatedData.success) {
        throw new AppError("Validasi gagal", 400, validatedData.error.flatten().fieldErrors);
    }

    // 3. Keamanan Tambahan: Pastikan hanya kasir (atau admin/role terkait) yang bisa menukar menu
    const userRole = req.user!.role;
    if (userRole !== "CASHIER" && userRole !== "ADMIN") {
        throw new AppError("Akses ditolak! Hanya Kasir yang diizinkan menukar menu pesanan pelanggan", 403);
    }

    // 4. Ekstrak data yang sudah divalidasi
    const { order_item_id, new_menu_id, qty_to_swap, notes } = validatedData.data;

    // 5. Eksekusi service swap item
    const updatedOrder = await swapOrderItemService(
        orderId,
        order_item_id,
        new_menu_id,
        qty_to_swap,
        notes // <--- Lempar notes ke service
    );

    // 6. Return response success
    return responseSuccess(
        res,
        "Menu pesanan berhasil ditukar",
        updatedOrder,
        200
    );
});

// remove/void order item controller
export const removeOrderItemController = asyncHandler(async (req: AuthRequest, res: Response) => {
    
    const { id: orderId } = req.params;

    if (typeof orderId !== "string") {
        throw new AppError("ID Pesanan tidak valid", 400);
    }

    // Validasi data dari Frontend
    const validatedData = removeOrderItemSchema.safeParse(req.body);

    if (!validatedData.success) {
        throw new AppError("Validasi gagal", 400, validatedData.error.flatten().fieldErrors);
    }

    // Keamanan hak akses
    const userRole = req.user!.role;
    if (userRole !== "CASHIER" && userRole !== "ADMIN") {
        throw new AppError("Akses ditolak! Hanya Kasir yang diizinkan menghapus pesanan pelanggan", 403);
    }

    // Eksekusi hapus item dan kalkulasi ulang
    const updatedOrder = await removeOrderItemService(orderId, validatedData.data.order_item_id);

    return responseSuccess(
        res,
        "Menu berhasil dihapus dan total nota telah disesuaikan",
        updatedOrder,
        200
    );
});