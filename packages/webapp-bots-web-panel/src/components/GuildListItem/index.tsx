import React, { Component } from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { GuildListItem_guild } from '~/__generated__/GuildListItem_guild.graphql';
import { DISCORD_CDN_URL } from '~/constants';

import { GuildItem, GuildItemName, ImageIcon, NoImageIcon } from './elements';

interface Props {
  guild: GuildListItem_guild;
}

class GuildListItemView extends Component<Props> {
  renderGuildIcon = () => {
    const {
      guild: { icon, discordId },
    } = this.props;

    const iconMarkup = icon ? (
      <ImageIcon
        src={`${DISCORD_CDN_URL}/icons/${discordId}/${icon}.png?size=100px`}
      />
    ) : (
      <NoImageIcon />
    );

    return iconMarkup;
  };
  render() {
    const {
      guild: { name, id },
    } = this.props;
    return (
      <GuildItem to={`/guilds/${id}`}>
        {this.renderGuildIcon()}
        <GuildItemName>{name}</GuildItemName>
      </GuildItem>
    );
  }
}

export default createFragmentContainer(
  GuildListItemView,
  graphql`
    fragment GuildListItem_guild on Guild {
      id
      discordId
      name
      icon
    }
  `
);
