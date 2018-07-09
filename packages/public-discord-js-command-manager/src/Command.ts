import {
  Message,
  Role,
  User,
  TextChannel,
  Channel,
  PermissionResolvable
} from 'discord.js';
import { isArray, each, every, keys, find } from 'lodash';
import CommandRuntimeError from './CommandRuntimeError';

export enum DiscordPermissions {
  CREATE_INSTANT_INVITE = 'CREATE_INSTANT_INVITE',
  KICK_MEMBERS = 'KICK_MEMBERS',
  BAN_MEMBERS = 'BAN_MEMBERS',
  ADMINISTRATOR = 'ADMINISTRATOR',
  MANAGE_CHANNELS = 'MANAGE_CHANNELS',
  MANAGE_GUILD = 'MANAGE_GUILD',
  ADD_REACTIONS = 'ADD_REACTIONS',
  VIEW_AUDIT_LOG = 'VIEW_AUDIT_LOG',
  VIEW_CHANNEL = 'VIEW_CHANNEL',
  SEND_MESSAGES = 'SEND_MESSAGES',
  SEND_TTS_MESSAGES = 'SEND_TTS_MESSAGES',
  MANAGE_MESSAGES = 'MANAGE_MESSAGES',
  EMBED_LINKS = 'EMBED_LINKS',
  ATTACH_FILES = 'ATTACH_FILES',
  READ_MESSAGE_HISTORY = 'READ_MESSAGE_HISTORY',
  MENTION_EVERYONE = 'MENTION_EVERYONE',
  USE_EXTERNAL_EMOJIS = 'USE_EXTERNAL_EMOJIS',
  CONNECT = 'CONNECT',
  SPEAK = 'SPEAK',
  MUTE_MEMBERS = 'MUTE_MEMBERS',
  DEAFEN_MEMBERS = 'DEAFEN_MEMBERS',
  MOVE_MEMBERS = 'MOVE_MEMBERS',
  USE_VAD = 'USE_VAD',
  CHANGE_NICKNAME = 'CHANGE_NICKNAME',
  MANAGE_NICKNAMES = 'MANAGE_NICKNAMES',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_WEBHOOKS = 'MANAGE_WEBHOOKS',
  MANAGE_EMOJIS = 'MANAGE_EMOJIS'
}
export enum ArgsPatternTypes {
  ROLE = 'Role', // TODO: Implement
  CHANNEL = 'Channel', // TODO: Implement
  NUMBER = 'Number',
  STRING = 'String',
  USER = 'User', // TODO: Implement
  BOOLEAN = 'Boolean' // TODO: Implement
}
export enum CommandExecuteResultCodes {
  SUCCESS = 'SUCCESS',
  INVALID = 'INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED'
}
export enum ParseArgsResultCodes {
  INVALID_COMMAND_FORMAT = 'INVALID_COMMAND_FORMAT',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  MISSING_ARGS = 'MISSING_ARGS',
  SUCCESS = 'SUCCESS'
}
export type Mention = Role | User | Channel;
export interface CommandArgs {
  [argName: string]: any;
}
export interface ConstructorArgs {
  prefix: string;
  keyword: string;
  message: Message;
}
export interface CommandExecuteResult {
  code: CommandExecuteResultCodes;
  data?: any;
}
export interface ChildClassArgsSchema {
  [argName: string]: ArgsPatternTypes;
}

const ARGS_REGEX = /"[^"]+"|'[^']+'|`[^`]+`|“[^“]+“|’[^’]+’|\S+/g;
const ARGS_PATTERN_REGEX = /\{(([a-zA-Z0-9]+):([a-zA-Z0-9]+))+\}/g;
const ARGS_PATTERN_ITEM_REGEX = /\{([a-zA-Z0-9]+):([a-zA-Z0-9]+)\}/;
const USER_ARG_REGEX = /^<@(\d+)>$/;
const ROLE_MENTION_ARG_REGEX = /^<@&(\d+)>$/;
const CHANNEL_ARG_REGEX = /^<#(\d+)>$/;
const STRING_ARG_REGEX = /^"([^"]+)"|'([^']+)'|`([^`]+)`|’([^’]+)’|“([^“]+)“|(\S+)$/;

export class CommandBase {
  static argsPattern: string;
  static keywords: string[];
  static directMessage: boolean = false;

  argTypeParsers = {
    [ArgsPatternTypes.NUMBER]: (
      value: string
    ): { code: ParseArgsResultCodes; data?: number; argValue?: string } => {
      const res = Number(value);
      if (isNaN(res)) {
        return { code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT };
      }
      return { code: ParseArgsResultCodes.SUCCESS, data: res };
    },
    [ArgsPatternTypes.STRING]: (
      value: string
    ): { code: ParseArgsResultCodes; data?: string; argValue?: string } => {
      // TODO: Prevent mentions here
      return { code: ParseArgsResultCodes.SUCCESS, data: value };
    },
    [ArgsPatternTypes.CHANNEL]: (
      value: string
    ): {
      code: ParseArgsResultCodes;
      data?: TextChannel;
      argValue?: string;
    } => {
      const match = value.match(CHANNEL_ARG_REGEX);

      if (!match) return { code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT };

      const id = match[1];
      if (!id) {
        return { code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT };
      }
      const channel = this.message.mentions.channels.get(id);
      if (!channel) {
        console.warn(
          `Unexpected case ocurred: Channel is mentioned in a message, but message has no such channel in the messageMentions collection`
        );
        return { code: ParseArgsResultCodes.RESOURCE_NOT_FOUND };
      }

      return { code: ParseArgsResultCodes.SUCCESS, data: channel };
    },
    [ArgsPatternTypes.ROLE]: (
      value: string
    ): { code: ParseArgsResultCodes; data?: Role; argValue?: string } => {
      const match = value.match(ROLE_MENTION_ARG_REGEX);

      // Match by mention
      if (match) {
        const id = match[1];
        if (!id) {
          return { code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT };
        }
        const role = this.message.mentions.roles.get(id);
        if (!role) {
          console.warn(
            `Unexpected case ocurred: Role is mentioned in a message, but message has no such role in the messageMentions collection`
          );
          return { code: ParseArgsResultCodes.RESOURCE_NOT_FOUND };
        }
        return { code: ParseArgsResultCodes.SUCCESS, data: role };
      }

      // Match by name
      const role = this.message.guild.roles.find('name', value);
      if (role) {
        return { code: ParseArgsResultCodes.SUCCESS, data: role };
      }

      return { code: ParseArgsResultCodes.RESOURCE_NOT_FOUND, argValue: value };
    },
    [ArgsPatternTypes.USER]: (
      value: string
    ): { code: ParseArgsResultCodes; data?: User; argValue?: string } => {
      // TODO: Support strings
      const match = value.match(USER_ARG_REGEX);
      if (!match) return { code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT };
      const id = match[1];
      if (!id) {
        return { code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT };
      }

      const user = this.message.mentions.users.get(id);
      if (!user) {
        console.warn(
          `Unexpected case ocurred: User is mentioned in a message, but message has no such user in the messageMentions collection`
        );
        return { code: ParseArgsResultCodes.RESOURCE_NOT_FOUND };
      }

      return { code: ParseArgsResultCodes.SUCCESS, data: user };
    },
    [ArgsPatternTypes.BOOLEAN]: (
      value: string
    ): { code: ParseArgsResultCodes; data?: boolean; argValue?: string } => {
      const normalizedValue = value.toLocaleLowerCase();
      if (normalizedValue === 'true') {
        return { code: ParseArgsResultCodes.SUCCESS, data: true };
      }
      if (normalizedValue === 'false') {
        return { code: ParseArgsResultCodes.SUCCESS, data: true };
      }
      return { code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT };
    }
  };

  prefix: string;
  message: Message;
  keyword: string;
  args: CommandArgs;

  static getName() {
    return (this as any).name;
  }

  private sendInvalidCommandFormatError = () => {
    this.message.channel.send(
      `Invalid command format for command: ${this.prefix}${this.keyword}`
    );
  };

  private sendMissingArgsError = () => {
    this.message.channel.send(
      `Missing arguments for command: ${this.prefix}${this.keyword}`
    );
  };

  private sendArgsResourceNotFound = ({
    argName,
    argType,
    argValue
  }: {
    argName: string;
    argType: ArgsPatternTypes;
    argValue?: string;
  }) => {
    const valueString = argValue ? ` with value "${argValue}"` : '';
    this.message.channel.send(
      `Could not find ${argType} (${argName})${valueString}`
    );
  };

  private sendUnauthorizedMessage = () => {
    this.message.channel.send('You are not allowed to run this command');
  };

  private parseArgs = (): {
    code: ParseArgsResultCodes;
    argName?: string;
    argValue?: string;
    argType?: ArgsPatternTypes;
  } => {
    const ChildClass = this.constructor as typeof Command;
    const argsText = this.message.content.replace(
      `${this.prefix}${this.keyword}`,
      ''
    );
    const { argsSchema } = ChildClass;
    const argsMatch = argsText.match(ARGS_REGEX);

    if (argsMatch && !ChildClass.argsPattern) {
      return { code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT };
    }

    if (argsMatch === null) {
      if (ChildClass.argsPattern) {
        return { code: ParseArgsResultCodes.MISSING_ARGS };
      }
      return { code: ParseArgsResultCodes.SUCCESS };
    }

    if (argsMatch.length < keys(argsSchema).length) {
      return { code: ParseArgsResultCodes.MISSING_ARGS };
    }

    const parsedArgs = {};
    let invalidArgData: {
      code?: ParseArgsResultCodes;
      argName?: string;
      argType?: ArgsPatternTypes;
      argValue?: string;
    } = {};

    every(argsSchema, (argType, argName) => {
      let argMatch = argsMatch.shift() as string;
      let strippedMatch;
      const quotedMatch = argMatch.match(STRING_ARG_REGEX);
      if (quotedMatch) {
        quotedMatch.shift();
        strippedMatch = find(quotedMatch, (val?: string) => !!val);
      }

      argMatch = strippedMatch ? strippedMatch : argMatch;
      const parseResult = this.argTypeParsers[argType](argMatch);

      if (parseResult.code !== ParseArgsResultCodes.SUCCESS) {
        invalidArgData = {
          code: parseResult.code,
          argName,
          argType,
          argValue: parseResult.argValue
        };
        return false;
      }

      parsedArgs[argName] = parseResult.data;
      return true;
    });

    if (invalidArgData.code) {
      return {
        code: invalidArgData.code,
        argName: invalidArgData.argName,
        argType: invalidArgData.argType,
        argValue: invalidArgData.argValue
      };
    }

    this.args = parsedArgs;
    return { code: ParseArgsResultCodes.SUCCESS };
  };

  private parseArgsPattern = () => {
    const argsPattern = (this.constructor as typeof Command).argsPattern;
    if (!argsPattern) return;
    const match = argsPattern.match(ARGS_PATTERN_REGEX);
    const argsPatternMatch = argsPattern.match(ARGS_PATTERN_REGEX);

    if (argsPatternMatch === null) {
      throw new Error(`argsPattern "${argsPattern}" is invalid`);
    }
    if (!match) {
      throw new Error(
        `'argsPattern' "${argsPattern}" '${(this as any).constructor.getName()}' is invalid`
      );
    }

    each(match, item => {
      const itemMatch = item.match(ARGS_PATTERN_ITEM_REGEX);
      if (!itemMatch) {
        throw new Error(
          `'argsPattern' argument "${item}" in '${(this as any).constructor.getName()}' is invalid`
        );
      }
      const argName = itemMatch[1];
      const argType = itemMatch[2];

      (this as any).constructor.argsSchema[argName] = argType;
    });
  };

  private validatePermissions = (): boolean => {
    const { permissionsRequired } = this.constructor as typeof Command;
    if (!isArray(permissionsRequired) || !permissionsRequired.length) {
      return true;
    }

    if (!this.message.member) {
      throw new Error(`
        >> Cannot validate permissions.
        Member from author '${
          this.message.author.username
        }' was not found in message. Defaulting to invalid.`);
    }
    return (
      this.message.member &&
      this.message.member.hasPermission(
        permissionsRequired as PermissionResolvable[]
      )
    );
  };

  private ignoreIfPrivateIsDisabled = (): boolean => {
    const { directMessage } = this.constructor as typeof Command;
    return (
      (!!directMessage && !!this.message.guild) ||
      (!directMessage && !this.message.guild)
    );
  };

  runErrorHandler = async (error: CommandRuntimeError): Promise<any> => {
    let handled = false;
    const errorHandler = (this as any).onError;

    handled = await (errorHandler
      ? errorHandler(error)
      : Promise.resolve(false));
    return handled;
  };

  execute = async (): Promise<CommandExecuteResult> => {
    const shouldIgnore = this.ignoreIfPrivateIsDisabled();
    if (shouldIgnore) {
      return { code: CommandExecuteResultCodes.INVALID };
    }

    const hasPermissions = this.validatePermissions();
    if (!hasPermissions) {
      this.sendUnauthorizedMessage();
      return { code: CommandExecuteResultCodes.UNAUTHORIZED };
    }

    this.parseArgsPattern();
    const { code, argName, argType, argValue } = this.parseArgs();

    if (!hasPermissions) {
      await this.sendUnauthorizedMessage();
      return { code: CommandExecuteResultCodes.UNAUTHORIZED };
    }

    if (code !== ParseArgsResultCodes.SUCCESS) {
      switch (code) {
        case ParseArgsResultCodes.INVALID_COMMAND_FORMAT: {
          this.sendInvalidCommandFormatError();
          return { code: CommandExecuteResultCodes.INVALID };
        }
        case ParseArgsResultCodes.RESOURCE_NOT_FOUND: {
          const name = argName || 'Unknown';
          const type = argType as ArgsPatternTypes;
          this.sendArgsResourceNotFound({
            argName: name,
            argType: type,
            argValue
          });
          return { code: CommandExecuteResultCodes.INVALID };
        }
        case ParseArgsResultCodes.MISSING_ARGS: {
          this.sendMissingArgsError();
          return { code: CommandExecuteResultCodes.INVALID };
        }
      }
    }

    const res = await (this as any).run(this.message, this.args);
    return { code: CommandExecuteResultCodes.SUCCESS, data: res };
  };

  constructor({
    keyword,
    prefix,
    message
  }: {
    prefix: string;
    keyword: string;
    message: Message;
  }) {
    this.prefix = prefix;
    this.message = message;
    this.keyword = keyword;
    this.args = {};
    const ChildClass = this.constructor as typeof Command;
    ChildClass.argsSchema = {};

    if (!ChildClass.keywords) {
      throw new Error(
        `'keywords' is not defined in Command '${ChildClass.getName()}'`
      );
    }
  }
}

export default abstract class Command extends CommandBase {
  static argsSchema: ChildClassArgsSchema;
  static keywords: string[];
  static directMessage: boolean;
  static permissionsRequired: DiscordPermissions[]; // Improve typing
  abstract run(message: Message, args: CommandArgs): Promise<any>;
}
