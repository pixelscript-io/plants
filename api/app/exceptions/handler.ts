import ApiError from '#exceptions/api_error'
import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof ApiError) {
      return ctx.response.status(error.status).send({ errors: [{ message: error.message }] })
    }

    // Keep 404s in the documented { errors: [...] } shape, in every environment.
    const code = (error as { code?: string }).code
    if (code === 'E_ROW_NOT_FOUND' || code === 'E_ROUTE_NOT_FOUND') {
      return ctx.response.notFound({ errors: [{ message: 'Resource not found.' }] })
    }
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
