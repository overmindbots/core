/**
 * Used internally to extend the Error class
 */
export class CustomError extends Error {
  constructor(message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

/**
 * Used for type refinement. This error shouldn't be actually thrown and
 * is the equivalent of a TypeError in runtime
 */
export class AssertionError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class UnexpectedError extends Error {
  constructor(message?: string) {
    super(message);
  }
}
