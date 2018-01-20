// @flow
import schema from 'schm'

const convertEmptyToTrue = (object: Object): Object => (
  Object.keys(object).reduce((finalObject, key) => ({
    ...finalObject,
    [key]: object[key] === '' ? true : object[key],
  }), {})
)

/**
 * Returns an express middleware that validates and parses querystring based
 * on a given schema.
 * @example
 * const express = require('express')
 * const { query } = require('schm-express')
 *
 * const app = express()
 *
 * // request /?foo&bar=1&bar=baz
 * app.get('/', query({ foo: Boolean, bar: [String] }), (req, res) => {
 *   console.log(req.query) // { foo: true, bar: ['1', 'baz'] }
 * })
 */
export const query = (params: Object) => async (ctx: Object, next: Function) => {
  const querySchema = schema(params)
  const values = convertEmptyToTrue(ctx.query)
  try {
    ctx.query = await querySchema.validate(values)
    next()
  } catch (e) {
    ctx.state.schmError = true
    throw e
  }
}

/**
 * Returns an express middleware that validates and parses request body based
 * on a given schema.
 * @example
 * const express = require('express')
 * const bodyParser = require('body-parser')
 * const { body } = require('schm-express')
 *
 * const app = express()
 * app.use(bodyParser.json())
 * app.use(bodyParser.urlencoded({ extended: false }))
 *
 * // send { foo: 1, bar: 'baz' }
 * app.post('/', body({ foo: Boolean, bar: [String] }), (req, res) => {
 *   console.log(req.body) // { foo: true, bar: ['baz'] }
 * })
 */
export const body = (params: Object) => (req: Object, res: Object, next: Function) => {
  const bodySchema = schema(params)
  bodySchema.validate(req.body).then((parsed) => {
    req.body = parsed
    next()
  }).catch((errors) => {
    req.schmError = true
    next(errors)
  })
}

/**
 * Handles errors from schm-express.
 * @example
 * const express = require('express')
 * const { query } = require('schm-express')
 *
 * const app = express()
 *
 * // request / without querystring
 * app.post('/', query({ foo: { type: Boolean, required: true } }), (req, res) => {
 *   ...
 * })
 *
 * app.use(errorHandler())
 *
 * // it will respond with 400 and error descriptor in response body
 */
export const errorHandler = () => async (ctx: Object, next: Function) => {
  try {
    await next()
  } catch (e) {
    if (ctx.state.schmError) {
      ctx.body = e
      ctx.status = 400
    }
  }
}
