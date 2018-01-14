import express from 'express'
import bodyParser from 'body-parser'
import request from 'supertest'
import { query, body, errorHandler } from '../src'

const createApp = (middleware) => {
  const app = express()
  app.use(bodyParser())
  app.post('/', middleware, (req, res) => res.send({
    query: req.query,
    body: req.body,
  }))
  app.use(errorHandler())
  return app
}

describe('query', () => {
  it('handles ?foo as foo=true', async () => {
    const schema = query({ foo: Boolean })
    const app = createApp(schema)
    const response = await request(app).post('?foo')
    expect(response.body.query.foo).toBe(true)
  })

  it('handles array in querystring', async () => {
    const schema = query({ foo: [String] })
    const app = createApp(schema)
    const response = await request(app).post('?foo=1&foo=baz')
    expect(response.body.query.foo).toEqual(['1', 'baz'])
  })

  it('handles errors', async () => {
    const schema = query({ foo: { type: Boolean, required: true } })
    const app = createApp(schema)
    const response = await request(app).post('/')
    expect(response.status).toBe(400)
    expect(response.body).toMatchSnapshot()
  })
})

describe('body', () => {
  it('handles schema', async () => {
    const schema = body({ foo: Boolean })
    const app = createApp(schema)
    const response = await request(app).post('/').send({ foo: 1 })
    expect(response.body.body.foo).toBe(true)
  })

  it('handles errors', async () => {
    const schema = body({ foo: { type: Boolean, required: true } })
    const app = createApp(schema)
    const response = await request(app).post('/')
    expect(response.status).toBe(400)
    expect(response.body).toMatchSnapshot()
  })
})

describe('errorHandler', () => {
  it('passes through', async () => {
    const app = createApp((req, res, next) => next(true))
    const response = await request(app).post('/')
    expect(response.status).toBe(500)
  })
})