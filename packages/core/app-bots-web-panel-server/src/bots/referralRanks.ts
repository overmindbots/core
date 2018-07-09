import P from 'bluebird';
import checksum from 'checksum';
import { Client } from 'discord.js';
import { includes } from 'lodash';
import { DISCORD_BOT_REFERRAL_RANKS_TOKEN } from '~/constants';
import { BOT_TYPES } from '@overmindbots/shared-utils/constants';
import { OwnerNotificationMessage } from '@overmindbots/shared-models';
import { createAsyncCatcher } '@overmindbots/shared-utils';

const asyncCatcher = createAsyncCatcher(error => {
  // tslint:disable-next-line
  console.error(`Error on Bot Client: ${error.message}`);
});

class ReferralRanksBot {
  static botType = BOT_TYPES.REFERRAL_RANKS;
  client: Client;

  constructor() {
    this.client = new Client({
      messageCacheMaxSize: 1,
      shardCount: 1,
      shardId: 0,
      disabledEvents: [
        'TYPING_START',
        'MESSAGE_UPDATE',
        'MESSAGE_REACTION_ADD',
        'MESSAGE_REACTION_REMOVE',
        'PRESENCE_UPDATE',
        'VOICE_SERVER_UPDATE',
        'VOICE_STATE_UPDATE',
        'GUILD_MEMBER_ADD',
        'GUILD_MEMBER_REMOVE',
        'GUILD_MEMBER_UPDATE',
        'GUILD_ROLE_CREATE',
        'GUILD_ROLE_DELETE',
        'GUILD_ROLE_UPDATE',
        'GUILD_BAN_ADD',
        'GUILD_BAN_REMOVE',
        'CHANNEL_CREATE',
        'CHANNEL_DELETE',
        'CHANNEL_UPDATE',
        'CHANNEL_PINS_UPDATE',
        'MESSAGE_CREATE',
        'MESSAGE_DELETE',
        'MESSAGE_DELETE_BULK',
        'MESSAGE_REACTION_REMOVE_ALL',
        'USER_UPDATE',
        'USER_NOTE_UPDATE',
        'USER_SETTINGS_UPDATE',
        'TYPING_START',
        'RELATIONSHIP_ADD',
        'RELATIONSHIP_REMOVE',
      ],
    });
    this.client.on(
      'ready',
      asyncCatcher(async () => {
        const guildsCount = this.client.guilds.array().length;
        // tslint:disable-next-line
        console.log(`Initialized bot. Guilds: ${guildsCount}`);
      })
    );

    this.client.on(
      'error',
      asyncCatcher(async err => {
        // tslint:disable-next-line
        console.error(err);
      })
    );

    this.client.on(
      'warn',
      asyncCatcher(async warn => {
        console.warn(warn);
      })
    );
  }

  start = () => {
    this.client.login(DISCORD_BOT_REFERRAL_RANKS_TOKEN);
  };

  broadcast = asyncCatcher(async (message: string) => {
    const chk = checksum(message);
    const { botType } = ReferralRanksBot;
    // tslint:disable-next-line
    console.log('== BROADCASTING MESSAGE ==');
    const sentMessages = await OwnerNotificationMessage.find({
      checksum: chk,
      botType,
    });

    // tslint:disable-next-line
    console.log('sentMessages', sentMessages.length);

    const sentUserDiscordIds = sentMessages.map(
      ({ userDiscordId }) => userDiscordId
    );

    // tslint:disable-next-line
    console.log('sentUserDiscordIds', sentUserDiscordIds.length);
    const usersToMessage = this.client.guilds
      .filter(({ ownerID }) => !includes(sentUserDiscordIds, ownerID))
      .map(({ owner }) => owner);

    // tslint:disable-next-line
    console.log('usersToMessage', usersToMessage.length);

    await P.each(usersToMessage, async user => {
      if (!user) {
        // tslint:disable-next-line
        console.log('Skipping non existent user');
        return;
      }
      await user.send(message).catch(err => {
        // tslint:disable-next-line
        console.error(err);
      });
      await OwnerNotificationMessage.findOneAndUpdate(
        { botType, userDiscordId: user.id },
        {
          botType,
          userDiscordId: user.id,
          checksum: chk,
        },
        { upsert: true }
      );
      // tslint:disable-next-line
      console.log(`# Sent message to: ${user.displayName}`);
    });

    // tslint:disable-next-line
    console.log(`===> Sent all messages. (${usersToMessage.length})`);
  });
}
const referralRanksInstance = new ReferralRanksBot();

export default referralRanksInstance;
