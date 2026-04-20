import { Application, Router } from "express"
import AuthRouter from "./auth.route";
import TableRouter from "./table.route";
import MenuRouter from "./menu.route";
import DiscountRouter from './discount.route';
import ProfileRouter from "./profile.route";

const _routes: Array<[string, Router]> = [
    ["/auth", AuthRouter],
    ["/table", TableRouter],
    ["/menu", MenuRouter],
    ["/discount", DiscountRouter],
    ["/profile", ProfileRouter]
]

export const routes = (app: Application) => {
    _routes.forEach((route) => {
        const [url, router] = route;
        app.use(`/api${url}`, router);
    });
}