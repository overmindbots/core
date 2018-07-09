import React, { Component } from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { Popup } from 'semantic-ui-react';
import { BotInstanceListItem_botInstance } from '~/__generated__/BotInstanceListItem_botInstance.graphql';
import botIconReferralRanksImg from '~/assets/botIconReferralRanks.svg';
import { BOT_ADD_URLS } from '~/constants';
import { BOT_TYPES, BOTS } from '~/shared/constants';

import { BotInstanceExternalLink, BotInstanceInternalLink } from './elements';

interface Props {
  botInstance: BotInstanceListItem_botInstance | null;
  botType: BOT_TYPES;
  guildId: string;
  guildDiscordId: string;
}

class BotInstanceListItemView extends Component<Props> {
  render() {
    const { botInstance, botType, guildId, guildDiscordId } = this.props;

    if (!botInstance || !botInstance.enabled) {
      const addBotUrl = BOT_ADD_URLS[BOT_TYPES.REFERRAL_RANKS]({
        redirectUrl: `guilds/${guildId}?newBotType=${BOT_TYPES.REFERRAL_RANKS}`,
        guildDiscordId,
      });
      return (
        <Popup
          trigger={
            <BotInstanceExternalLink href={addBotUrl} botEnabled={false}>
              <img src={botIconReferralRanksImg} />
              <span>{BOTS[botType].name}</span>
            </BotInstanceExternalLink>
          }
          size="tiny"
          header="Add this bot!"
          content={`${
            BOTS[botType].name
          } Tracks invites and rewards your members with roles.`}
          position="bottom center"
        />
      );
    }

    const { enabled, id } = botInstance;

    return (
      <BotInstanceInternalLink
        replace
        to={`/botInstances/${id}`}
        botEnabled={enabled}
      >
        <img src={botIconReferralRanksImg} />
        <span>{BOTS[botType].name}</span>
      </BotInstanceInternalLink>
    );
  }
}

export default createFragmentContainer(
  BotInstanceListItemView,
  graphql`
    fragment BotInstanceListItem_botInstance on BotInstance {
      ... on ReferralRanks {
        id
        name
        enabled
        botType
      }
    }
  `
);
