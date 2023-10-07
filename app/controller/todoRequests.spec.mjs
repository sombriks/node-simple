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
