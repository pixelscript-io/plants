/**
 * A client error with a message that is safe to show. The exception handler
 * renders it as `{ errors: [{ message }] }` with the given status.
 */
export default class ApiError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 422
  ) {
    super(message)
  }
}
