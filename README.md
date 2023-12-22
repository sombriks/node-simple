# [how to provision a node service from scratch](https://github.com/sombriks/node-simple)

We're performing interactive steps adding small things one at a time!

- [original gist](https://gist.github.com/sombriks/4e17e8035f72cdb2656e26b604499744)
- [repo on github](https://github.com/sombriks/node-simple)
- [repo on gitlab](https://gitlab.com/sombriks/node-simple)

## requirements

- node 18

## minimal hello

```bash
mkdir simple-roadmap # create a folder
cd simple-roadmap
npm init -y # creates the `package.json` file, this folder is a node project now
npm i koa
touch index.mjs # you can use just .js extension, but adopting explicit .mjs or .cjs gives more control over module style
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

Koa is highly modular and there is a dedicated plugin to proper manage routes on it.

- Install [koa-router](https://github.com/koajs/router):

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

- Install [level](https://github.com/Level/level)
- Install [bodyparser](https://github.com/koajs/bodyparser)

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

- Install [nodemon](https://nodemon.io/) so you don't need to kill and restart every time:

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

- Install [mocha](https://mochajs.org/)
- Install [chai](https://www.chaijs.com/)

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

- Install [c8](https://github.com/bcoe/c8)

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

- Install [chai-http](https://www.chaijs.com/plugins/chai-http/)
- Install [chai-sinon](https://www.chaijs.com/plugins/sinon-chai/)
- Install [sinon](https://sinonjs.org/)

```bash
npm i -D chai-http sinon-chai sinon
```

Create a spec file (`app/controller/todoRequests.spec.mjs`):

```javascript
import chai, {expect} from "chai"
import chaiHttp from "chai-http"
import sinonChai from "sinon-chai"
import * as sinon from "sinon";

import * as controller from "./todoRequests.mjs"
import {app} from "../main.mjs"
import {db} from "../config/db.mjs"

chai.should()
chai.use(chaiHttp)
chai.use(sinonChai)

describe("simple requests test suite", () => {

  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.spy(db);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should return 'ONLINE' status", done => {
    chai
      .request(app.callback())
      .get("/status")
      .end((err, res) => {
        res.text.should.be.eql('ONLINE')
        done()
      })
  })

  it("should list todos", (done) => {
    chai
      .request(app.callback())
      .get("/todos")
      .end((err, res) => {
        res.body.should.be.an("Array")
        done()
      })
  })

  it("should insert a todo", async () => {
    const ctx = {request: {body: {message: "hello"}}, body: ""}
    await controller.insertTodoRequest(ctx)
    db.put.should.have.been.calledOnce // sinon-chai in action
  })
})
```

Here we can see chai-http doing some integration tests, and also we can see
sinon spying on db calls.

## Make the app aware of the environment

In order to make application more configurable and flexible, we can add checks
on environment variables, so we tweak the app behavior accordingly.

We can make listening port configurable:

```javascript
// index.mjs
import { app } from "./app/main.mjs"

const PORT = process.env.PORT || 3000

app.listen(PORT)
console.log(`http://localhost:${PORT}`)
```

If PORT environment variable is set, it will be used as listening port.

If no value is set for PORT environment variable, it fallbacks to 3000.

We can make database configurable:

```javascript
import { Level } from "level"

const LEVELDB = process.env.LEVELDB || "sample"

export const db = new Level(LEVELDB, { valueEncoding: "json" })
console.log(`database is ${LEVELDB}`)
```

## Use .env files

Once the app understands and expects some environment variables it's up to you
to properly configure them. Depending on how many projects are present in the
developer machine or any other external issue, it might be more tricky than it
should be.

On can make use of dot env files to proper manage such variables at development
time.

- Install [dotenv-flow](https://www.npmjs.com/package/dotenv-flow)

```bash
npm i dotenv-flow
```

Then create a file called `.env` and add your environment variables:

```dotenv
# variables needed by the application
PORT=3000
LEVELDB=sample
EXTRA_CONFIG=xpto
```

Finally, you must make the application aware of those variables. To do so, you
need to call the [`config()`](https://www.npmjs.com/package/dotenv-flow#usage)
function at entry point, but it's invasive; instead, modify _start_ and _dev_
scripts in `package.json` to perform dynamic loading:

```json
//...
"scripts" {
  "test": "mocha --recursive app",
  "test:coverage": "c8 npm run test",
  "start": "node -r dotenv-flow/config index.mjs",
  "dev": "nodemon -r dotenv-flow/config index.mjs"
}
//...
```

Check if it is working with this change in `index.mjs`:

```javascript
import { app } from "./app/main.mjs"

const PORT = process.env.PORT || 3000

app.listen(PORT)
console.log(`http://localhost:${PORT}`)
console.log(`EXTRA_CONFIG is ${process.env.EXTRA_CONFIG}`)
```

Kill nodemon process because dynamic loading occurs at startup.

the output should be something like this:

```bash
/usr/bin/npm run dev

> simple-roadmap@1.0.0 dev
> nodemon -r dotenv-flow/config index.mjs

[nodemon] 3.0.1
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node -r dotenv-flow/config index.mjs`
database is sample
http://localhost:3000
EXTRA_CONFIG is xpto
```

## Setup CI on version control provider

Let's use gitlab, for GitHub check
[these](https://github.com/sombriks/simple-knex-koa-example)
[examples](https://github.com/sombriks/sample-testable-code).

Add the [.gitlab-ci.yml](.gitlab-ci.yml) file:

```yml
image: node:latest
cache:
  paths:
    - node_modules/
run-tests:
  script:
    - npm ci
    - npm run test:coverage
```

Now whenever a push is made, gitlab runs the tests.

## Run as serverless application on Google Cloud Run

- Visit <https://console.cloud.google.com/run> and create a service
- Authorize GitHub (no gitlab, too bad!)
- Select the repository
- Check cloudbuild.yml option

Cloud Run will detect the rest for you.
[Live in less than 5 minutes](https://node-simple-f24wxjc6wa-uc.a.run.app/todos)

Updates every commit.

## Run as serverless application on
