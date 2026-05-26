import { Application, Router } from "express"
import TableRouter from "../services/table-service/table.route";
// import DiscountRouter from '../services/discount-service/discount.route';
// import NotifRoute from "../services/notification-service/notification.route";
import AdminRoute from "./admin.route";

const _routes: Array<[string, Router]> = [
    ["/table", TableRouter],
    // ["/discount", DiscountRouter],
    // ["/notification", NotifRoute],
    ["/admin", AdminRoute]
]

export const routes = (app: Application) => {
    _routes.forEach((route) => {
        const [url, router] = route;
        app.use(`/api${url}`, router);
    });
}