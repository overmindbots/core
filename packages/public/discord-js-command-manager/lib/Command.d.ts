import { Message, Role, User, TextChannel, Channel } from 'discord.js';
import CommandRuntimeError from './CommandRuntimeError';
export declare enum DiscordPermissions {
    CREATE_INSTANT_INVITE = "CREATE_INSTANT_INVITE",
    KICK_MEMBERS = "KICK_MEMBERS",
    BAN_MEMBERS = "BAN_MEMBERS",
    ADMINISTRATOR = "ADMINISTRATOR",
    MANAGE_CHANNELS = "MANAGE_CHANNELS",
    MANAGE_GUILD = "MANAGE_GUILD",
    ADD_REACTIONS = "ADD_REACTIONS",
    VIEW_AUDIT_LOG = "VIEW_AUDIT_LOG",
    VIEW_CHANNEL = "VIEW_CHANNEL",
    SEND_MESSAGES = "SEND_MESSAGES",
    SEND_TTS_MESSAGES = "SEND_TTS_MESSAGES",
    MANAGE_MESSAGES = "MANAGE_MESSAGES",
    EMBED_LINKS = "EMBED_LINKS",
    ATTACH_FILES = "ATTACH_FILES",
    READ_MESSAGE_HISTORY = "READ_MESSAGE_HISTORY",
    MENTION_EVERYONE = "MENTION_EVERYONE",
    USE_EXTERNAL_EMOJIS = "USE_EXTERNAL_EMOJIS",
    CONNECT = "CONNECT",
    SPEAK = "SPEAK",
    MUTE_MEMBERS = "MUTE_MEMBERS",
    DEAFEN_MEMBERS = "DEAFEN_MEMBERS",
    MOVE_MEMBERS = "MOVE_MEMBERS",
    USE_VAD = "USE_VAD",
    CHANGE_NICKNAME = "CHANGE_NICKNAME",
    MANAGE_NICKNAMES = "MANAGE_NICKNAMES",
    MANAGE_ROLES = "MANAGE_ROLES",
    MANAGE_WEBHOOKS = "MANAGE_WEBHOOKS",
    MANAGE_EMOJIS = "MANAGE_EMOJIS",
}
export declare enum ArgsPatternTypes {
    ROLE = "Role",
    CHANNEL = "Channel",
    NUMBER = "Number",
    STRING = "String",
    USER = "User",
    BOOLEAN = "Boolean",
}
export declare enum CommandExecuteResultCodes {
    SUCCESS = "SUCCESS",
    INVALID = "INVALID",
    UNAUTHORIZED = "UNAUTHORIZED",
}
export declare enum ParseArgsResultCodes {
    INVALID_COMMAND_FORMAT = "INVALID_COMMAND_FORMAT",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    MISSING_ARGS = "MISSING_ARGS",
    SUCCESS = "SUCCESS",
}
export declare type Mention = Role | User | Channel;
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
export declare class CommandBase {
    static argsPattern: string;
    static keywords: string[];
    static directMessage: boolean;
    argTypeParsers: {
        [ArgsPatternTypes.NUMBER]: (value: string) => {
            code: ParseArgsResultCodes;
            data?: number | undefined;
            argValue?: string | undefined;
        };
        [ArgsPatternTypes.STRING]: (value: string) => {
            code: ParseArgsResultCodes;
            data?: string | undefined;
            argValue?: string | undefined;
        };
        [ArgsPatternTypes.CHANNEL]: (value: string) => {
            code: ParseArgsResultCodes;
            data?: TextChannel | undefined;
            argValue?: string | undefined;
        };
        [ArgsPatternTypes.ROLE]: (value: string) => {
            code: ParseArgsResultCodes;
            data?: Role | undefined;
            argValue?: string | undefined;
        };
        [ArgsPatternTypes.USER]: (value: string) => {
            code: ParseArgsResultCodes;
            data?: User | undefined;
            argValue?: string | undefined;
        };
        [ArgsPatternTypes.BOOLEAN]: (value: string) => {
            code: ParseArgsResultCodes;
            data?: boolean | undefined;
            argValue?: string | undefined;
        };
    };
    prefix: string;
    message: Message;
    keyword: string;
    args: CommandArgs;
    static getName(): any;
    private sendInvalidCommandFormatError;
    private sendMissingArgsError;
    private sendArgsResourceNotFound;
    private sendUnauthorizedMessage;
    private parseArgs;
    private parseArgsPattern;
    private validatePermissions;
    private ignoreIfPrivateIsDisabled;
    runErrorHandler: (error: CommandRuntimeError) => Promise<any>;
    execute: () => Promise<CommandExecuteResult>;
    constructor({keyword, prefix, message}: {
        prefix: string;
        keyword: string;
        message: Message;
    });
}
export default abstract class Command extends CommandBase {
    static argsSchema: ChildClassArgsSchema;
    static keywords: string[];
    static directMessage: boolean;
    static permissionsRequired: DiscordPermissions[];
    abstract run(message: Message, args: CommandArgs): Promise<any>;
}
