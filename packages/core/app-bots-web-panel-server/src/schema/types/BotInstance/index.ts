import { GraphQLUnionType } from 'graphql';
import { BOT_TYPES, BOTS } from '@overmindbots/shared-utils/constants';
import { GraphQLNotFoundError } from '~/shared/graphqlErrors';
import { BotInstanceDocument, Guild } from '@overmindbots/shared-models';

import ReferralRanksType from './ReferralRanks';

export const sharedResolvers = {
  name: (source: BotInstanceDocument) => BOTS[source.botType].name,
  guild: async ({ guildDiscordId }: BotInstanceDocument) => {
    const guild = await Guild.findOne({ discordId: guildDiscordId });
    return guild;
  },
};

export default new GraphQLUnionType({
  name: 'BotInstance',
  description: 'Union of all BotInstance subtypes',
  types: () => [ReferralRanksType],
  resolveType: ({ botType }) => {
    switch (botType) {
      case BOT_TYPES.REFERRAL_RANKS: {
        return ReferralRanksType;
      }
      default: {
        throw new GraphQLNotFoundError(`Bot instance of type: '${botType}'`);
      }
    }
  },
});
