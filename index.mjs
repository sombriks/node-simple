import { app } from "./app/main.mjs"

const PORT = process.env.PORT || 3000

app.listen(PORT)
console.log(`http://localhost:${PORT}`)
console.log(`EXTRA_CONFIG is ${process.env.EXTRA_CONFIG}`)
