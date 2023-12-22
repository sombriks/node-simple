import { db } from "../config/db.mjs"

export const listTodoService = async (query = {}) => {
  const { limit = 500, reverse = true } = query
  return await db.values({ ...query, limit: parseInt(limit), reverse: "true" == `${reverse}` }).all()
}

export const findTodoService = async key =>
  await db.get(key)

export const insertTodoService = async ({ message, done }) =>
  await updateTodoService({ key: new Date().getTime(), message, done })

export const updateTodoService = async ({ key, message, done }) => {
  const todo = { key, message, done }
  await db.put(key, todo)
  return todo
}

export const delTodoService = async key =>
  await db.del(key)
