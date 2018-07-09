import { Message } from 'discord.js';
import { each, includes, keys, find } from 'lodash';
import { CommandBase, CommandExecuteResultCodes } from './Command';
import CommandRuntimeError from './CommandRuntimeError';

export enum ProcessMessageResultCodes {
  FINISHED = 'FINISHED',
  ERROR_HANDLED = 'ERROR_HANDLED',
  INVALID = 'INVALID',
  NON_COMMAND = 'NON_COMMAND',
  NO_COMMAND_MATCH = 'NO_COMMAND_MATCH',
  UNAUTHORIZED = 'UNAUTHORIZED'
}
export interface ProcessMessageResult {
  code: ProcessMessageResultCodes; // No
  data?: any;
}
export interface ProcessMessageOpts {
  prefix?: string;
}

const FORBIDDEN_PREFIXES = ['@', '#', '"'];
const KEYWORD_PATTERN = /^\S{1}(\S+)/;

export default class CommandManager {
  prefix: string;
  keywords: {
    [word: string]: string;
  };
  commands: {
    [commandName: string]: typeof CommandBase;
  };

  constructor({ prefix }: { prefix: string }) {
    if (!prefix) throw new Error('No prefix for commands was passed');
    if (includes(FORBIDDEN_PREFIXES, prefix)) {
      throw new Error(`The prefix ${prefix} is forbidden`);
    }

    this.prefix = prefix;
    this.keywords = {};
    this.commands = {};
  }

  private messageIsCommand = (message: Message, prefixOverride?: string) => {
    const prefix = prefixOverride || this.prefix;
    const { content, author } = message;
    const startsWithPrefix = content.startsWith(prefix);
    if (author.bot) return false;
    if (!startsWithPrefix) return false;
    return true;
  };

  private getKeyword = (message: Message): string | null => {
    const match = message.content.match(KEYWORD_PATTERN);
    if (!match) return null;
    const keyword = match[1];
    return keyword;
  };

  private identify = (message: Message) => {
    const keyword = this.getKeyword(message);
    const commandName = find(
      this.keywords,
      (_, savedKeyword) => savedKeyword === keyword
    );

    if (!commandName) return;

    const CommandClass = this.commands[commandName];

    return CommandClass;
  };

  processMessage = async (
    message: Message,
    opts?: ProcessMessageOpts
  ): Promise<ProcessMessageResult> => {
    const prefixOverride = opts && opts.prefix;
    const prefix = prefixOverride || this.prefix;
    if (includes(FORBIDDEN_PREFIXES, prefix)) {
      throw new Error(`The prefix '${prefixOverride}' is forbidden`);
    }

    if (!this.messageIsCommand(message, prefix)) {
      return {
        code: ProcessMessageResultCodes.NON_COMMAND
      };
    }

    const CommandClass = this.identify(message);
    if (!CommandClass) {
      return {
        code: ProcessMessageResultCodes.NO_COMMAND_MATCH
      };
    }
    const keyword = this.getKeyword(message) as string;
    const command = new CommandClass({ message, keyword, prefix });
    let res;

    try {
      res = await command.execute();
    } catch (err) {
      const error = new CommandRuntimeError(err, { command });

      const handled = await command.runErrorHandler(error);
      if (handled) {
        return {
          code: ProcessMessageResultCodes.ERROR_HANDLED,
          data: error
        };
      }

      throw error;
    }

    switch (res.code) {
      case CommandExecuteResultCodes.INVALID: {
        return {
          code: ProcessMessageResultCodes.INVALID,
          data: res.data
        };
      }
      case CommandExecuteResultCodes.UNAUTHORIZED: {
        return {
          code: ProcessMessageResultCodes.UNAUTHORIZED,
          data: res.data
        };
      }
      case CommandExecuteResultCodes.SUCCESS: {
        return {
          code: ProcessMessageResultCodes.FINISHED,
          data: res.data
        };
      }
    }

    return {
      code: ProcessMessageResultCodes.ERROR_HANDLED,
      data: res.data
    };
  };

  registerCommand = (CommandClass: typeof CommandBase) => {
    const commandName = CommandClass.getName();

    if (this.commands[commandName]) {
      throw new Error(`Command '${commandName}' is already registered.`);
    }
    if (!CommandClass.keywords) {
      throw new Error(
        `Command ${commandName} must have static property 'keywords'`
      );
    }

    const collidingKeyword = find(CommandClass.keywords, keyword =>
      includes(keys(this.keywords), keyword)
    );

    if (collidingKeyword) {
      throw new Error(
        `Command "${commandName}" has keyword "${collidingKeyword}" which is already registered by another Command`
      );
    }

    this.commands[commandName] = CommandClass;

    each(CommandClass.keywords, keyword => {
      this.keywords[keyword] = CommandClass.name as string;
    });
  };
}
