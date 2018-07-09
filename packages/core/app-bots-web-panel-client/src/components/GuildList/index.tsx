import { map } from 'lodash';
import React, { Component } from 'react';
import { graphql, QueryRenderer } from 'react-relay';
import { Container, Loader } from 'semantic-ui-react';
import GuildListItem from '~/components/GuildListItem';
import relayEnvironment from '~/relayEnvironment';

import { Wrapper } from './elements';

const GuildListQuery = graphql`
  query GuildListQuery {
    currentUser {
      guilds(last: 100) @connection(key: "GuildList_guilds") {
        edges {
          node {
            id
            discordId
            name
            icon
            ...GuildListItem_guild
          }
        }
      }
    }
  }
`;

export default class GuildListView extends Component {
  render() {
    return (
      <QueryRenderer
        query={GuildListQuery}
        variables={{}}
        environment={relayEnvironment}
        render={({ error, props }) => {
          if (error) {
            throw error;
          }
          if (!props) {
            return <Loader active />;
          }

          return (
            <Container>
              <Wrapper>
                {map(props.currentUser.guilds.edges, ({ node }) => (
                  <GuildListItem key={node.id} guild={node} />
                ))}
              </Wrapper>
            </Container>
          );
        }}
      />
    );
  }
}
