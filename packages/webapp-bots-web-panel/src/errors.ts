/**
 * Used internally to extend the Error class
 *
 * @private
 * @class CustomError
 * @extends {Error}
 */
class CustomError extends Error {
  constructor(message: string, extra?: string) {
    let finalMessage = message;
    finalMessage += extra ? `: ${extra}` : '';

    super(finalMessage);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}
/**
 * Thrown when a request in a protected endpoint is not Authenticated
 *
 * @export
 * @class AssertionFailed
 * @extends {CustomError}
 */
export class AssertionError extends CustomError {
  constructor(message?: string) {
    super('Assertion Failed', message);
  }
}
