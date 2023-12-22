import Koa from "koa"
import Router from "@koa/router"
import { bodyParser } from "@koa/bodyparser"
import {
  delTodoRequest,
  findTodoRequest,
  insertTodoRequest,
  listTodoRequest,
  updateTodoRequest
} from "./controller/todoRequests.mjs"

export const app = new Koa()
const router = new Router()

router.get("/status", async ctx => ctx.body = "ONLINE")

router.get("/todos", listTodoRequest)
router.get("/todos/:key", findTodoRequest)
router.post("/todos", insertTodoRequest)
router.put("/todos/:key", updateTodoRequest)
router.del("/todos/:key", delTodoRequest)

app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())
