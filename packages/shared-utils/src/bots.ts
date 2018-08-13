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

export function isDiscordDMChannel(
  channel: Discord.Channel
): channel is Discord.DMChannel {
  return channel.type === 'dm';
}

const confirmationReplies = ['yes', 'confirm', 'ok', 'y', 'alright', 'agree'];

/**
 * Utility for awaiting confirmation inside a command
 * @param options.timeoutMessage Message to send when author didn't reply
 * in too long. Pass null to skip this message
 * @param options.cancelMessage Message to send when the author cancels.
 * Pass null to skip this message
 */
export const awaitConfirmation = async (
  message: Discord.Message,
  options: {
    timeoutMessage?: string | null;
    cancelMessage?: string | null;
  } = {}
) => {
  const { channel, author } = message;
  if (!isDiscordTextChannel(channel) && !isDiscordDMChannel(channel)) {
    return false;
  }
  const {
    timeoutMessage = `${author}, You took too long to reply. Please try again`,
    cancelMessage = 'Command aborted',
  } = options;

  let reply;
  try {
    const collected = await channel.awaitMessages(
      ({ author: replyAuthor }) => replyAuthor.id === author.id,
      replyConfig
    );
    reply = collected.first().content.toLowerCase();
  } catch (err) {
    if (timeoutMessage) {
      await channel.send(timeoutMessage);
    }
  }

  const confirmed = includes(confirmationReplies, reply);
  if (!confirmed) {
    if (cancelMessage) {
      await channel.send(cancelMessage);
    }
  }

  return confirmed;
};
