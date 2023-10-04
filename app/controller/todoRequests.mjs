import {
  delTodoService,
  findTodoService,
  insertTodoService,
  listTodoService,
  updateTodoService
} from "../service/todoService.mjs"

export const listTodoRequest = async ctx => {
  ctx.body = await listTodoService()
}

export const findTodoRequest = async ctx => {
  const { key } = ctx.params
  ctx.body = await findTodoService(key)
}

export const insertTodoRequest = async ctx => {
  const { message, done } = ctx.request.body
  ctx.body = await insertTodoService({ message, done })
}

export const updateTodoRequest = async ctx => {
  const { message, done } = ctx.request.body
  const { key } = ctx.params
  ctx.body = await updateTodoService({ key, message, done })
}

export const delTodoRequest = async ctx => {
  const { key } = ctx.params
  ctx.body = await delTodoService(key)
}