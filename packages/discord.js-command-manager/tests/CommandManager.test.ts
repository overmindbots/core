import {
  Channel,
  Collection,
  GuildMember,
  Message,
  MessageMentions,
  Role,
  TextChannel,
  User,
} from 'discord.js';
import { find, merge } from 'lodash';

import { Command } from '../src';
import { CommandArgs, CommandBase, DiscordPermissions } from '../src/Command';
import CommandManager, {
  ProcessMessageResultCodes,
} from '../src/CommandManager';
import CommandRuntimeError from '../src/CommandRuntimeError';

class CollectionMock {
  map: Map<any, any>;
  get = args => this.map.get(args);
  find = (attr, val) => {
    const iter = this.map.entries();
    let iterVal;
    let res;
    while ((iterVal = iter.next())) {
      if (iterVal.done) break;
      if (iterVal.value && iterVal.value[1][attr] === val) {
        res = iterVal.value[1];
        break;
      }
    }
    return res;
  };
  set = (key, val) => this.map.set(key, val);
  constructor() {
    this.map = new Map();
  }
}

const defaultUser = {
  bot: false,
};
const defaultChannel = {
  send() {},
} as TextChannel;
const defaultMessage = {
  content: 'foo',
  author: defaultUser,
  channel: defaultChannel,
  guild: {},
};

// Factories
function createMessage(message: object = {}) {
  return merge({}, defaultMessage, message) as Message;
}
function createUser(user: object = {}) {
  return merge({}, defaultUser, user) as User;
}
function createChannel(channel: object = {}) {
  return merge({}, defaultChannel, channel) as Channel;
}

// Command classes
class SetRank extends Command {
  static keywords = ['set-rank', 'rank', 'add-rank'];
  static argsPattern = '{rank:Rank} {invites:Number}';
  async run(message: Message, args: CommandArgs) {
    return { message, args };
  }
}
class Test extends Command {
  static keywords = ['test'];
  static argsPattern = '{level:Number} {id:String}';
  async run(
    message: Message,
    args: CommandArgs
  ): Promise<{ message: Message; args: CommandArgs }> {
    return { message, args };
  }
}

// Manager mocks
const emptyCommandManager = new CommandManager({ prefix: '!' });

// Tests
describe('CommandManager', () => {
  describe('#processMessage', () => {
    describe('command throws error', () => {
      test('should should extend errors with command instance data', async () => {
        const errMsg = 'Fake error';
        class ErrorCommand extends Command {
          static keywords = ['throw-error'];
          async run() {
            throw new Error(errMsg);
          }
        }
        const message = createMessage({ content: '!throw-error' });
        const commandManager = new CommandManager({ prefix: '!' });
        commandManager.registerCommand(ErrorCommand);
        const spy = jest.fn();

        try {
          const res = await commandManager.processMessage(message);
          spy();
        } catch (error) {
          expect(error.message).toEqual(errMsg);
          expect(error.data.command).toBeTruthy();
        }
        expect(spy).not.toHaveBeenCalled();
      });

      test('should handle error with error handler if provided', async () => {
        const spy = jest.fn();
        class ErrorHandledCommand extends Command {
          static keywords = ['handle-err'];
          async onError(error) {
            console.log('HARROW');
            spy(error);
            return true;
          }
          async run() {
            throw new Error('test');
          }
        }
        const msg = createMessage({ content: '!handle-err' });
        const commandManager = new CommandManager({ prefix: '!' });
        commandManager.registerCommand(ErrorHandledCommand);

        await commandManager.processMessage(msg);
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('author is bot', () => {
      test('should resolve with NON_COMMAND', async () => {
        const anyMessage = createMessage({ content: 'foo bar' });
        const result = await emptyCommandManager.processMessage(anyMessage);
        expect(result.code).toEqual(ProcessMessageResultCodes.NON_COMMAND);
      });
    });

    describe('message is private', () => {
      test('should resolve with INVALID if directMessage is false', async () => {
        const spy = jest.fn();
        class SomeCommand extends Command {
          static keywords = ['cmd'];
          async run() {
            spy();
          }
        }
        const message = createMessage({ content: '!cmd', guild: null });
        const commandManager = new CommandManager({ prefix: '!' });
        commandManager.registerCommand(SomeCommand);
        const res = await commandManager.processMessage(message);
        expect(res.code).toEqual(ProcessMessageResultCodes.INVALID);
        expect(spy).not.toHaveBeenCalled();
      });

      test('should resolve finished and run correctly if directMessage is set', async () => {
        const spy = jest.fn();
        class SomeCommand extends Command {
          static directMessage = true;
          static keywords = ['cmd'];
          async run() {
            spy();
          }
        }
        const message = createMessage({ content: '!cmd', guild: null });
        const commandManager = new CommandManager({ prefix: '!' });
        commandManager.registerCommand(SomeCommand);
        const res = await commandManager.processMessage(message);
        expect(res.code).toEqual(ProcessMessageResultCodes.FINISHED);
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('command is customized in call', () => {
      test('should use override prefix if passed', async () => {
        const spy = jest.fn();
        class CommandForPrefix extends Command {
          static keywords = ['custom'];
          async run() {
            spy();
          }
        }
        const commandManager = new CommandManager({ prefix: '=' });
        commandManager.registerCommand(CommandForPrefix);
        const message = createMessage({ content: '^custom ' });
        const result = await commandManager.processMessage(message, {
          prefix: '^',
        });
        expect(result.code).not.toEqual(ProcessMessageResultCodes.NON_COMMAND);
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('has no command', () => {
      test('should do nothing', async () => {
        const anyMessage = createMessage({ content: 'foo bar' });
        await emptyCommandManager.processMessage(anyMessage as Message);
      });
    });

    describe('has commands, none match', () => {
      test('should do nothing', async () => {
        const commandMessage = createMessage({ content: '!foo bar' });
        const commandManager = new CommandManager({ prefix: '!' });
        commandManager.registerCommand(SetRank);
        await commandManager.processMessage(commandMessage);
      });
    });

    describe('has matching command', () => {
      test('should correctly parse arguments', async () => {
        const commandManager = new CommandManager({ prefix: '!' });
        const testCommandMessage = createMessage({
          content: '!test 10 testId',
        });
        commandManager.registerCommand(Test);
        const { code, data } = await commandManager.processMessage(
          testCommandMessage
        );

        expect(code).toEqual(ProcessMessageResultCodes.FINISHED);

        const args = data.args;
        expect(args).toEqual({
          id: 'testId',
          level: 10,
        });
      });

      test('should display correct error if an args resource is not found', async () => {
        class SomeCommand extends Command {
          static keywords = ['foo'];
          static argsPattern = '{badRole:Role} {role:Role}';
          async run() {}
        }
        const spy = jest.fn();
        const commandManager = new CommandManager({ prefix: '%' });
        const exitentRole = { id: '123', name: 'exitentRole' };
        const message = createMessage({
          content: '%foo NonExistentRole exitentRole',
          author: {
            bot: false,
          },
          guild: {
            members: new CollectionMock(),
            roles: new CollectionMock(),
          },
          channel: {
            send: spy,
          },
        });
        message.guild.roles.set(exitentRole.id, exitentRole as Role);
        commandManager.registerCommand(SomeCommand);
        const res = await commandManager.processMessage(message);
        expect(res.code).toEqual(ProcessMessageResultCodes.INVALID);
        expect(spy).toHaveBeenCalledWith(
          'Could not find Role (badRole) with value "NonExistentRole"'
        );
      });

      test('should correctly parse mentions', async () => {
        class ParserCommand extends Command {
          static keywords = ['parse'];
          static argsPattern =
            '{user:User} {role:Role} {channel:Channel} {roleAsString:Role} {roleInQuotes:Role} {roleInQuotes2:Role} {roleInQuotes3:Role} {roleInQuotes4:Role}';
          async run(
            message: Message,
            args: CommandArgs
          ): Promise<{ message: Message; args: CommandArgs }> {
            return { message, args };
          }
        }
        const commandManager = new CommandManager({ prefix: '!' });
        const testMentionsMessage = createMessage({
          content:
            '!parse <@123> <@&444444> <#555> RoleAs-Str "Role as string" `Role as string` “Role as string“ ’Role as string’ \'Role as string\'',
          mentions: {
            users: new CollectionMock(),
            roles: new CollectionMock(),
            channels: new CollectionMock(),
          },
          guild: {
            roles: new CollectionMock(),
          },
        });
        const user = {
          username: 'userone',
          id: '123',
        };
        const role = {
          id: '444444',
          name: 'roleOne',
        };
        const roleStr = {
          id: '113311',
          name: 'RoleAs-Str',
        };
        const roleQuotes = {
          id: '333',
          name: 'Role as string',
        };
        const channel = {
          id: '555',
        };

        testMentionsMessage.mentions.users.set(user.id, user as User);
        testMentionsMessage.mentions.roles.set(role.id, role as Role);
        testMentionsMessage.guild.roles.set(roleStr.id, roleStr as Role);
        testMentionsMessage.guild.roles.set(roleQuotes.id, roleQuotes as Role);
        testMentionsMessage.mentions.channels.set(
          '555',
          channel as TextChannel
        );

        commandManager.registerCommand(ParserCommand);
        const res = await commandManager.processMessage(testMentionsMessage);
        expect(res.code).toEqual(ProcessMessageResultCodes.FINISHED);
        expect(res.data.args).toEqual({
          user,
          role,
          channel,
          roleAsString: roleStr,
          roleInQuotes: roleQuotes,
          roleInQuotes2: roleQuotes,
          roleInQuotes3: roleQuotes,
          roleInQuotes4: roleQuotes,
        });
      });

      test('should run command', async () => {
        const commandManager = new CommandManager({ prefix: '!' });
        const testMessage = createMessage({ content: '!foo true 10' });
        const spy = jest.fn();
        class TestCommand extends Command {
          static keywords = ['foo'];
          static argsPattern = '{boolVal:Boolean}{valueOne:Number}';
          async run() {
            spy();
          }
        }
        commandManager.registerCommand(TestCommand);
        await commandManager.processMessage(testMessage);
        expect(spy).toBeCalled();
      });

      test.skip('should resolve INVALID if command format is wrong', () => {});
    });

    describe('has no arguments', () => {
      test('should work without arguments', async () => {
        const commandManager = new CommandManager({ prefix: '!' });
        const testMessage = createMessage({ content: '!help ' });
        const spy = jest.fn();
        class HelpCommand extends Command {
          static keywords = ['help', 'h'];
          async run() {
            spy();
          }
        }
        commandManager.registerCommand(HelpCommand);
        const res = await commandManager.processMessage(testMessage);
        expect(spy).toBeCalled();
        expect(res.code).toEqual(ProcessMessageResultCodes.FINISHED);
      });
    });

    describe('user is not authorized', () => {
      test('should send a message to the user and return right code', async () => {
        const commandManager = new CommandManager({ prefix: '!' });
        const sendSpy = jest.fn();
        const message = createMessage({
          content: '!auth',
          member: createUser({
            hasPermission: () => false,
          }),
          channel: {
            send: sendSpy,
          },
        });
        const spy = jest.fn();
        class AuthCommand extends Command {
          static keywords = ['auth'];
          static permissionsRequired = [DiscordPermissions.MANAGE_ROLES];
          async run() {
            spy();
          }
        }
        commandManager.registerCommand(AuthCommand);
        const { code } = await commandManager.processMessage(message);
        expect(spy).not.toHaveBeenCalled();
        expect(code).toEqual(ProcessMessageResultCodes.UNAUTHORIZED);
        expect(sendSpy).toBeCalled();
      });
    });
  });

  describe('#registerCommand', () => {
    test('should save command in internal list', () => {
      const commandManager = new CommandManager({ prefix: '!' });
      commandManager.registerCommand(SetRank);
      expect(commandManager.commands).toEqual({ [SetRank.getName()]: SetRank });
    });
  });
});
