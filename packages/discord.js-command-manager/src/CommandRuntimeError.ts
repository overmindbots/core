import { CommandBase } from './index';

export default class CommandManagerError extends Error {
  data?: {
    command?: CommandBase;
  };
  path?: string;
  code?: number;

  constructor(
    error: { message: string; path?: string; code?: number },
    data?: { command: CommandBase }
  ) {
    super(error.message);
    this.name = 'CommandManagerError';
    this.data = data || {};
    this.path = error.path;
    this.code = error.code;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(error.message).stack;
    }
  }
}
