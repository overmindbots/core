import { compact, filter, find, map } from 'lodash';
import React, { Component, StatelessComponent } from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { Link } from 'react-router-dom';
import { Button, Container, Message, Table } from 'semantic-ui-react';
import { ReferralRanksRanksList_botInstance } from '~/__generated__/ReferralRanksRanksList_botInstance.graphql';
import { AssertionError } from '~/errors';

import { RankType, RoleType } from './RoleEdit';
import RoleEdit from './RoleEdit';

export interface RelayProps {
  botInstance: ReferralRanksRanksList_botInstance;
}

interface RanksListState {
  editingRoleId: string | null;
}
interface RanksListProps {
  botInstanceId: string;
  roles: Array<RoleType>;
  ranks: Array<RankType>;
  maxRoleDiscordId: string;
}

const BotRoleRow: StatelessComponent<{ role: RoleType }> = ({ role }) => (
  <Table.Row active>
    <Table.Cell colSpan="3" textAlign="center">
      The Bot's Role ({role.name})
    </Table.Cell>
  </Table.Row>
);

class ReferralRanksRanksList extends Component<RanksListProps, RanksListState> {
  state = {
    editingRoleId: null,
  };

  setEditing = (rankId: string | null) => {
    this.setState({ editingRoleId: rankId });
  };

  render() {
    const { roles, ranks, maxRoleDiscordId, botInstanceId } = this.props;
    const rolesCountMinusOwn = roles.length - 1;
    if (!rolesCountMinusOwn) {
      return (
        <Message info>
          You have no roles created in your <b>Discord Server</b> yet. Create
          one in your server settings in <b>the Discord client</b>
        </Message>
      );
    }

    let belowBotRole = false;

    return (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan="3">
              Roles in your Discord
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {map(roles, role => {
            const rank = find(ranks, {
              roleDiscordId: role.discordId,
            });
            const isBotRole = maxRoleDiscordId === role.discordId;

            if (isBotRole) {
              belowBotRole = true;
              return <BotRoleRow role={role} key={role.discordId} />;
            }

            return (
              <RoleEdit
                botInstanceId={botInstanceId}
                form={`editRole-${role.discordId}`}
                belowBotRole={belowBotRole}
                key={`${role.discordId}`}
                rank={rank}
                role={role}
                isRoleBeingEdited={this.state.editingRoleId === role.discordId}
                onEdit={() => this.setEditing(role.discordId)}
                onCancel={() => this.setEditing(null)}
              />
            );
          })}
        </Table.Body>
      </Table>
    );
  }
}

const ReferralRanksRanksListPage: StatelessComponent<RelayProps> = ({
  botInstance,
}) => {
  const {
    guild: { roles: rolesData },
    ranks: ranksData,
    maxRoleDiscordId,
  } = botInstance;

  if (!rolesData || !ranksData) {
    throw new AssertionError();
  }

  const ranks = compact(map(ranksData.edges, edge => edge && edge.node));
  const roles = filter(
    compact(map(rolesData.edges, edge => edge && edge.node)),
    ({ managed, discordId }) => {
      return !managed || discordId === maxRoleDiscordId;
    }
  );

  if (!maxRoleDiscordId) {
    return (
      <Container>
        <Message warning>
          Your server seems to be still setting up, try again in a couple of
          minutes. If this message is still showing after a while contact us in
          our discord server.
        </Message>
      </Container>
    );
  }

  return (
    <Container>
      <ReferralRanksRanksList
        botInstanceId={botInstance.id}
        roles={roles}
        ranks={ranks}
        maxRoleDiscordId={maxRoleDiscordId}
      />
      <Container textAlign="right">
        <Button as={Link} to={`/botInstances/${botInstance.id}`}>
          Back
        </Button>
      </Container>
      <br />
    </Container>
  );
};

export default createFragmentContainer(
  ReferralRanksRanksListPage,
  graphql`
    fragment ReferralRanksRanksList_botInstance on ReferralRanks {
      id
      name
      guildDiscordId
      maxRoleDiscordId
      ranks(last: 1000) @connection(key: "ReferralRanksRanksList_ranks") {
        edges {
          node {
            id
            invitesRequired
            roleDiscordId
          }
        }
      }
      guild {
        roles(first: 1000) @connection(key: "ReferralRanksRanksList_roles") {
          edges {
            node {
              id
              name
              discordId
              color
              position
              managed
            }
          }
        }
      }
    }
  `
);
