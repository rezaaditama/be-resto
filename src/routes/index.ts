import { Application, Router } from "express"
import AuthRouter from "./auth.route";
import TableRouter from "./table.route";
import TaxesRouter from "./taxes.route";
import MenuRouter from "./menu.route";

const _routes: Array<[string, Router]> = [
    ["/auth", AuthRouter],
    ["/table", TableRouter],
    ["/taxes", TaxesRouter],
    ["/menu", MenuRouter]
]

export const routes = (app: Application) => {
    _routes.forEach((route) => {
        const [url, router] = route;
        app.use(`/api${url}`, router);
    });
}