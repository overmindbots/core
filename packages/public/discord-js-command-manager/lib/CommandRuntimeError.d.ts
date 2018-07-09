import { CommandBase } from './index';
export default class CommandManagerError extends Error {
    data?: {
        command?: CommandBase;
    };
    path?: string;
    code?: number;
    constructor(error: {
        message: string;
        path?: string;
        code?: number;
    }, data?: {
        command: CommandBase;
    });
}
