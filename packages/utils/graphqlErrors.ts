/**
 * Used internally to extend the Error class
 */
export class CustomGraphQLError extends Error {
  constructor(code: string, extra?: string) {
    super(code);

    if (extra) {
      // tslint:disable-next-line
      console.error(extra);
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomGraphQLError);
    }
  }
}
/**
 * Thrown when a request in a protected endpoint is not Authenticated
 */
export class GraphQLUnauthenticatedError extends CustomGraphQLError {
  constructor(extra?: string) {
    super('UNAUTHENTICATED', extra);
  }
}
/**
 * Thrown when a session is not authorized to do a certain request
 */
export class GraphQLUnauthorizedError extends CustomGraphQLError {
  constructor(extra?: string) {
    super('UNAUTHORIZED', extra);
  }
}

/**
 * When a request is incorrectly formed
 */
export class GraphQLBadRequestError extends CustomGraphQLError {
  constructor(extra?: string) {
    super('BAD_REQUEST', extra);
  }
}

/**
 * Resource not found (equivalent to 404)
 */
export class GraphQLNotFoundError extends CustomGraphQLError {
  constructor(extra?: string) {
    super('NOT_FOUND', extra);
  }
}

/**
 * An unexpected error
 */
export class GraphQLUnexpectedError extends CustomGraphQLError {
  constructor(extra?: string) {
    super('UNEXPECTED', extra);
  }
}

/**
 * Rate limit error
 */
export class GraphQLRateLimitError extends CustomGraphQLError {
  constructor(extra?: string) {
    super('RATE_LIMIT', extra);
  }
}
