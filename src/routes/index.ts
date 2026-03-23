import { Application, Router } from "express"
import AuthRouter from "./auth.route";
import CategoryRouter from "./category.route";

const _routes: Array<[string, Router]> = [
    ["/auth", AuthRouter],
    ["/category", CategoryRouter]
]

export const routes = (app: Application) => {
    _routes.forEach((route) => {
        const [url, router] = route;
        app.use(`/api${url}`, router);
    });
}