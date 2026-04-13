import { Application, Router } from "express"
import AuthRouter from "./auth.route";
import TableRouter from "./table.route";
import TaxesRouter from "./taxes.route";

const _routes: Array<[string, Router]> = [
    ["/auth", AuthRouter],
    ["/table", TableRouter],
    ["/taxes", TaxesRouter]
]

export const routes = (app: Application) => {
    _routes.forEach((route) => {
        const [url, router] = route;
        app.use(`/api${url}`, router);
    });
}