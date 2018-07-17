// TODO: Remove this
/**
 * Error that should never be thrown. Used for refining types
 */
export class AssertionError extends Error {
  constructor() {
    super('Fatal: AssertionError');
  }
}
