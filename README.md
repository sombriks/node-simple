# how to provision a node service from scratch

We're performing interactive steps adding small things one at a time!

## requirements

- node 18

## minimal hello

```bash
mkdir simple-roadmap # create a folder
cd simple-roadmap
npm init -y # creates the `package.json` file, this folder is a node project now
npm i koa
touch index.mjs # you can use just .js extension, but adpting explicit .mjs or .cjs gives more control over module style
```

This is the initial content of index.mjs:

```javascript
import Koa from "koa"

const app = new Koa()

app.use(async ctx => ctx.body = "ONLINE")

app.listen(3000)
console.log("http://localhost:3000")
```

Then add the start script into `package.json`:

```json
//...
"scripts" {
  "test": "echo \"Error: no test specified\" && exit 1",
  "start": "node index.mjs"
}
//...
```

And run wih `npm start`.

## adding routes

Koa is highly modular and there is a dedicated plugin to porper manage routes on it.

Install [koa-router](https://github.com/koajs/router):

```bash
npm i @koa/router
```

Modify index.mjs:

```javascript
import Koa from "koa"
import Router from "@koa/router"

const app = new Koa()
const router = new Router()

router.get("/status", async ctx => ctx.body = "ONLINE")

app.use(router.routes()).use(router.allowedMethods())

app.listen(3000)
console.log("http://localhost:3000")
```

Kill previous `npm start` and re-run it to see new `http://localhost:3000/status` endpoint

## adding simple database for a todo list

Install [level](https://github.com/Level/level)
Install [bodyparser](https://github.com/koajs/bodyparser)

```bash
npm i level
npm i @koa/bodyparser
```

Modify your index.mjs again:

```javascript
import Koa from "koa"
import Router from "@koa/router"
import { bodyParser } from "@koa/bodyparser"
import { Level } from "level"

const app = new Koa()
const router = new Router()
const db = new Level("sample", { valueEncoding: "json" })

router.get("/status", async ctx => ctx.body = "ONLINE")

router.get("/todos", async ctx =>
  ctx.body = await db.values({ limit: 100 }).all())

router.post("/todos", async ctx => {
  const { message, done } = ctx.request.body
  const key = new Date().getTime()
  const todo = { key, message, done }
  await db.put(key, todo)
  ctx.body = todo
})

app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())

app.listen(3000)
console.log("http://localhost:3000")
```

Kill previous console again and re-run. Then open a second console and save your first todo:

```bash
curl -X POST http://localhost:3000/todos -H 'Content-Type: application/json' -d '{"message":"hello"}'
```

Check if it was properly saved visiting `http://localhost:3000/todos`

## add nodemon for better DX

Install [nodemon](https://nodemon.io/) so you don't need to kill and restart every time:

```bash
npm i -D nodemon
```

Then modify the scripts section on `package.json`:

```json
//...
"scripts" {
  "test": "echo \"Error: no test specified\" && exit 1",
  "start": "node index.mjs",
  "dev": "nodemon index.mjs"
}
//...
```

For now on, start the program with `npm run dev`

## time to proper modularize the script

After add a few more endpoints to complete the REST service, that script will become too horrible to watch:

```javascript
import Koa from "koa"
import Router from "@koa/router"
import { bodyParser } from "@koa/bodyparser"
import { Level } from "level"

const app = new Koa()
const router = new Router()
const db = new Level("sample", { valueEncoding: "json" })

router.get("/status", async ctx => ctx.body = "ONLINE")

router.get("/todos", async ctx =>
  ctx.body = await db.values({ limit: 100 }).all())

router.get("/todos/:key", async ctx =>
  ctx.body = await db.get(ctx.params.key))

router.post("/todos", async ctx => {
  const { message, done } = ctx.request.body
  const key = new Date().getTime()
  const todo = { key, message, done }
  await db.put(key, todo)
  ctx.body = todo
})

router.put("/todos/:key", async ctx => {
  const { message, done } = ctx.request.body
  const key = ctx.params.key
  const todo = { key, message, done }
  await db.put(key, todo)
  ctx.body = todo
})

router.del("/todos/:key", async ctx =>
  ctx.body = await db.del(ctx.params.key))

app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())

app.listen(3000)
console.log("http://localhost:3000")
```

Strictly speaking it works, but it's very coupled and troublesome to test except for integration tests.

Little opportunity for modularization.

Let's start by creating a folder structure and some boilerplate:

```bash
mkdir -p app/{controller,service,config}
touch app/controller/todoRequests.mjs app/service/todoService.mjs app/config/db.mjs app/main.mjs
```

We'll dismantle our single file project into this opinionated folder structure so we can put each concern in it's own place.

### Why app folder instead of src folder

Use `src` whenever you have any compilation step for your code -- typescript for example.

Use `app` folder if it is meant to run the way it is.

### app/config/db.mjs

```javascript
import { Level } from "level"

export const db = new Level("sample", { valueEncoding: "json" })

```

### app/service/todoService.mjs

```javascript
import { db } from "../config/db.mjs"

export const listTodoService = async () =>
  await db.values({ limit: 100 }).all()

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

```

### app/controller/todoRequests.mjs

```javascript
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

```

### app/main.mjs

```javascript
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

```

### index.mjs

Finally we rewrite the index.mjs once again:

```javascript
import { app } from "./app/main.mjs"

app.listen(3000)
console.log("http://localhost:3000")

```

No need to restart the service, nodemon did that for us.

We now have what people call _separation of concerns_.

## Adding some tests

Install [mocha](https://mochajs.org/)
Install [chai](https://www.chaijs.com/)

```bash
npm i -D mocha chai
```

Create a test spec (`app/service/todoService.spec.mjs`):

```javascript
import * as service from "./todoService.mjs"

import chai, {expect} from "chai"

chai.should()

describe("simple unit test suite", () => {

  const message = `message ${new Date().getTime()}`
  const messageUpdated = `message ${new Date().getTime()} updated`

  let key = -1

  it("should create a todo", async () => {
    const result = await service.insertTodoService({ message })
    result.message.should.be.eql(message)
    key = result.key
  })

  it("should list a todo", async () => {
    const result = await service.listTodoService()
    result.should.be.an('Array')
  })

  it("should find a todo", async () => {
    const result = await service.findTodoService(key)
    result.should.be.an('Object')
    result.key.should.be.eql(key)
  })

  it("should update a todo", async () => {
    const result = await service.updateTodoService({ key, messageUpdated })
    result.should.be.an('Object')
    result.key.should.be.eql(key)
  })

  it("should delete a todo", async () => {
    const result = await service.delTodoService(key)
    expect(result).to.be.undefined
  })
})
```

Then modify your test script on `package.json`:

```json
//...
"scripts" {
  "test": "mocha --recursive app",
  "start": "node index.mjs",
  "dev": "nodemon index.mjs"
}
//...
```

Call the tests either with `npm run test` or with `npx mocha --recursive app`.

Tests are good because having them passing means that the code is supposed to be doing what it should do.

## Adding coverage

Install [c8](https://github.com/bcoe/c8)

```bash
npm i -D c8
```

Then add a test:coverage script on `package.json`:

```json
//...
"scripts" {
  "test": "mocha --recursive app",
  "test:coverage": "c8 npm run test",
  "start": "node index.mjs",
  "dev": "nodemon index.mjs"
}
//...
``` 

And run it:


```bash
npm run test:coverage
```

This is the sample output:

```bash
> simple-roadmap@1.0.0 test:coverage
> c8 npm run test


> simple-roadmap@1.0.0 test
> mocha --recursive app



  simple unit test suite
    ✔ should create a todo
    ✔ should list a todo
    ✔ should find a todo
    ✔ should update a todo
    ✔ should delete a todo


  5 passing (8ms)

-----------------------|---------|----------|---------|---------|-------------------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s             
-----------------------|---------|----------|---------|---------|-------------------------------
All files              |   87.39 |      100 |      50 |   87.39 |                               
 app                   |     100 |      100 |     100 |     100 |                               
  main.mjs             |     100 |      100 |     100 |     100 |                               
 app/config            |     100 |      100 |     100 |     100 |                               
  db.mjs               |     100 |      100 |     100 |     100 |                               
 app/controller        |   53.12 |      100 |       0 |   53.12 |                               
  todoRequests.mjs     |   53.12 |      100 |       0 |   53.12 | 10-11,14-16,19-21,24-27,30-32 
 app/service           |     100 |      100 |     100 |     100 |                               
  todoService.mjs      |     100 |      100 |     100 |     100 |                               
  todoService.spec.mjs |     100 |      100 |     100 |     100 |                               
-----------------------|---------|----------|---------|---------|-------------------------------

Process finished with exit code 0
```

Having tests is good, but it's coverage to explain how much we can trust the tests and the code.

## Mock some calls

Install [chai-http](https://www.chaijs.com/plugins/chai-http/)
Install [chai-sinon](https://www.chaijs.com/plugins/sinon-chai/)

```bash
npm i -D chai-http sinon-chai
```

## Make the app aware of the environment
