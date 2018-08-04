import Discord from 'discord.js';
import { includes } from 'lodash';

const replyConfig = {
  maxMatches: 1,
  time: 10000,
  errors: ['time'],
};

export function isDiscordTextChannel(
  channel: Discord.Channel
): channel is Discord.TextChannel {
  return channel.type === 'text';
}

const confirmationReplies = ['yes', 'confirm', 'ok', 'y', 'alright', 'agree'];

/**
 * Utility for awaiting confirmation inside a command
 * @param options.timeoutMessage Message to send when author didn't reply
 * in too long
 * @param options.cancelMessage Message to send when the author cancels
 */
export const awaitConfirmation = async (
  channel: Discord.Channel,
  author: Discord.User,
  options: {
    timeoutMessage: string;
    cancelMessage: string;
  } = {
    timeoutMessage: `${author}, You took too long to reply. Please try again`,
    cancelMessage: 'Command aborted',
  }
) => {
  if (!isDiscordTextChannel(channel)) {
    return false;
  }
  const { timeoutMessage, cancelMessage } = options;
  let reply;
  try {
    const collected = await channel.awaitMessages(
      ({ author: replyAuthor }) => replyAuthor.id === author.id,
      replyConfig
    );
    reply = collected.first().content.toLowerCase();
  } catch (err) {
    await channel.send(timeoutMessage);
  }

  const confirmed = includes(confirmationReplies, reply);
  if (!confirmed) {
    await channel.send(cancelMessage);
  }

  return confirmed;
};
