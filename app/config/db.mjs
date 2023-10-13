import { Level } from "level"

const LEVELDB = process.env.LEVELDB || "sample"

export const db = new Level(LEVELDB, { valueEncoding: "json" })
console.log(`database is ${LEVELDB}`)
