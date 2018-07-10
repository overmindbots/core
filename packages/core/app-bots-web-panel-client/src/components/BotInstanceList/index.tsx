import { BOT_TYPES } from '@overmindbots/shared-utils/constants';
import { filter, map } from 'lodash';
import querystring from 'query-string';
import React, { Component, Fragment } from 'react';
import { createRefetchContainer, graphql } from 'react-relay';
import { withRouter, RouteComponentProps } from 'react-router';
import { Container, Loader, Message } from 'semantic-ui-react';
import { BotInstanceList_guild } from '~/__generated__/BotInstanceList_guild.graphql';
import { BotInstanceListItem_botInstance } from '~/__generated__/BotInstanceListItem_botInstance.graphql';
import { BotInstanceListRefetchQueryResponse } from '~/__generated__/BotInstanceListRefetchQuery.graphql';
import BotInstanceListItem from '~/components/BotInstanceListItem';
import { AssertionError } from '~/errors';

import { Wrapper } from './elements';

interface RelayProps {
  guild: BotInstanceList_guild & {
    botInstances: { edges: Array<{ node: BotInstanceListItem_botInstance }> };
  };
  relay: {
    refetch(...args: any[]): void;
  };
}
interface RouteProps {
  newBotType?: number;
}

type Props = RelayProps &
  RouteComponentProps<RouteProps> &
  BotInstanceListRefetchQueryResponse;

class BotInstanceListView extends Component<Props, { shouldRefetch: boolean }> {
  state = { shouldRefetch: false };
  refetchInterval?: any;

  static getDerivedStateFromProps({ guild, location: { search } }: Props) {
    if (!search) {
      return { shouldRefetch: false };
    }

    const queryData = querystring.parse(search);
    const newBotType = queryData.newBotType;

    if (!location) {
      return { shouldRefetch: false };
    }
    if (!guild || !guild.botInstances) {
      return { shouldRefetch: false };
    }

    const [botInstanceEdge] = filter(guild.botInstances.edges, edge => {
      return edge && edge.node && edge.node.botType === newBotType;
    });
    const botInstance = botInstanceEdge && botInstanceEdge.node;
    const shouldRefetch = !botInstance || (botInstance && !botInstance.enabled);

    return { shouldRefetch };
  }

  doRefetchIfRequired = () => {
    const { shouldRefetch } = this.state;
    const {
      relay: { refetch },
    } = this.props;

    if (shouldRefetch) {
      refetch({}, null, null, { force: true });
    }
  };

  componentWillUnmount() {
    if (this.refetchInterval) {
      clearInterval(this.refetchInterval);
    }
  }

  componentDidMount() {
    this.doRefetchIfRequired();
    this.refetchInterval = setInterval(() => {
      this.forceUpdate();
    }, 3 * 1000);
  }
  componentDidUpdate() {
    this.doRefetchIfRequired();
  }

  render() {
    const { guild } = this.props;
    if (!guild || !guild.botInstances) {
      throw new AssertionError();
    }

    if (this.state.shouldRefetch) {
      return (
        <Fragment>
          <Message positive>
            <Message.Header>Almost there</Message.Header>
            <Message.Content>
              We are setting up your bot, please wait one second...
            </Message.Content>
          </Message>
          <Loader active />
        </Fragment>
      );
    }

    return (
      <Container>
        <Wrapper>
          {map(BOT_TYPES, botType => {
            if (!guild || !guild.botInstances) {
              throw new AssertionError();
            }
            const [botInstanceEdge] = filter(
              guild.botInstances.edges,
              edge =>
                edge &&
                edge.node &&
                edge.node.botType === BOT_TYPES.REFERRAL_RANKS
            );
            const botInstance = botInstanceEdge && botInstanceEdge.node;

            return (
              <BotInstanceListItem
                key={botType}
                botInstance={botInstance || null}
                botType={botType}
                guildId={guild.id}
                guildDiscordId={guild.discordId}
              />
            );
          })}
        </Wrapper>
      </Container>
    );
  }
}

// FIXME: Fix having to list all attributes, fragment spread is not working
export default createRefetchContainer(
  withRouter(BotInstanceListView),
  graphql`
    fragment BotInstanceList_guild on Guild {
      id
      name
      discordId
      botInstances(first: 100)
        @connection(key: "BotInstanceList_botInstances") {
        edges {
          node {
            ... on ReferralRanks {
              enabled
              botType
              ...BotInstanceListItem_botInstance
            }
          }
        }
      }
    }
  `,
  graphql`
    query BotInstanceListRefetchQuery($guildId: ID!) {
      guild(id: $guildId) {
        id
        name
        discordId
        ...BotInstanceList_guild
      }
    }
  `
);
