import { CommandManager } from '@overmindbots/discord.js-command-manager';
import { each } from 'lodash';
import * as commands from '~/commands';
import { DEFAULT_PREFIX } from '~/constants';

export const commandManager = new CommandManager({ prefix: DEFAULT_PREFIX });

each(commands, Command => {
  commandManager.registerCommand(Command);
});
