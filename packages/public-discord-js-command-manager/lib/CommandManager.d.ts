import { Message } from 'discord.js';
import { CommandBase } from './Command';
export declare enum ProcessMessageResultCodes {
    FINISHED = "FINISHED",
    ERROR_HANDLED = "ERROR_HANDLED",
    INVALID = "INVALID",
    NON_COMMAND = "NON_COMMAND",
    NO_COMMAND_MATCH = "NO_COMMAND_MATCH",
    UNAUTHORIZED = "UNAUTHORIZED",
}
export interface ProcessMessageResult {
    code: ProcessMessageResultCodes;
    data?: any;
}
export interface ProcessMessageOpts {
    prefix?: string;
}
export default class CommandManager {
    prefix: string;
    keywords: {
        [word: string]: string;
    };
    commands: {
        [commandName: string]: typeof CommandBase;
    };
    constructor({prefix}: {
        prefix: string;
    });
    private messageIsCommand;
    private getKeyword;
    private identify;
    processMessage: (message: Message, opts?: ProcessMessageOpts | undefined) => Promise<ProcessMessageResult>;
    registerCommand: (CommandClass: typeof CommandBase) => void;
}
