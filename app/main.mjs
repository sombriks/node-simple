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
router.post("/todo", insertTodoRequest)
router.put("/todo/:key", updateTodoRequest)
router.del("/todo/:key", delTodoRequest)

app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())
