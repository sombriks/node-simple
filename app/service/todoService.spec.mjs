import * as service from "./todoService.mjs"

import chai, { expect } from "chai"

chai.should()

describe("simple unit test suite (service)", () => {

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
