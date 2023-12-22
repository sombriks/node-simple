import chai from "chai"
import chaiHttp from "chai-http"
import sinonChai from "sinon-chai"
import * as sinon from "sinon";

import * as controller from "./todoRequests.mjs"
import { app } from "../main.mjs"
import { db } from "../config/db.mjs"
import { insertTodoService } from "../service/todoService.mjs"

chai.should()
chai.use(chaiHttp)
chai.use(sinonChai)

describe("simple unit test suite (controller)", () => {

  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.spy(db);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should return 'ONLINE' status", async () => {
    const result = await chai.request(app.callback()).get("/status")
    result.status.should.be.eql(200)
    result.text.should.be.eql('ONLINE')
  })

  it("should list todos", (done) => {
    // using promise/callback style
    chai
      .request(app.callback())
      .get("/todos")
      .end((err, res) => {
        res.status.should.be.eql(200)
        res.body.should.be.an("Array")
        done()
      })
  })

  it("should find one todo", async () => {
    const newTodo = await insertTodoService({ message: "one todo" })
    const result = await chai.request(app.callback()).get(`/todos/${newTodo.key}`)
    result.status.should.be.eql(200)
    result.body.should.be.an("Object")
    result.body.key.should.be.eql(newTodo.key)
  })

  it("should insert a todo", async () => {
    // curl -X POST http://localhost:3000/todos -H 'Content-Type: application/json' -d '{"message":"hello"}'
    const ctx = { request: { body: { message: "hello" } }, body: "" }
    await controller.insertTodoRequest(ctx) // we can skip koa
    db.put.should.have.been.calledOnce // sinon-chai in action
  })

  it("should update a todo", async () => {
    const todo = await insertTodoService({ message: "one todo" })
    todo.message = "one todo updated"
    todo.done = true
    const result = await chai.request(app.callback()).put(`/todos/${todo.key}`).send(todo)
    db.put.should.have.been.calledTwice
    result.status.should.be.eql(200)
    result.body.should.be.an("Object")
  })

  it("should delete a todo", async () => {
    const todo = await insertTodoService({ message: "one todo" })
    const result = await chai.request(app.callback()).del(`/todos/${todo.key}`)
    result.status.should.be.eql(204)
    db.del.should.have.been.calledOnce
  })
})
