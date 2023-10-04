import { Level } from "level"

export const db = new Level("sample", { valueEncoding: "json" })
