import { Application, Router } from "express"

import AdminRoute from "./admin.route";

const _routes: Array<[string, Router]> = [
    ["/admin", AdminRoute]
]

export const routes = (app: Application) => {
    _routes.forEach((route) => {
        const [url, router] = route;
        app.use(`/api${url}`, router);
    });
}