import React, { Component } from 'react';
import { graphql, QueryRenderer } from 'react-relay';
import { withRouter, RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Breadcrumb, Container, Divider, Loader } from 'semantic-ui-react';
import { BotInstanceList_guild } from '~/__generated__/BotInstanceList_guild.graphql';
import BotInstanceList from '~/components/BotInstanceList';
import relayEnvironment from '~/relayEnvironment';

interface ViewProps {
  guild: { id: string; name: string } & BotInstanceList_guild;
}

const query = graphql`
  query GuildsShowPageQuery($guildId: ID!) {
    guild(id: $guildId) {
      id
      name
      ...BotInstanceList_guild
    }
  }
`;

class GuildsShowPageView extends Component<ViewProps> {
  render() {
    const { guild } = this.props;
    return (
      <Container>
        <Breadcrumb size="huge">
          <Breadcrumb.Section as={Link} to={`/`} link>
            Dashboard
          </Breadcrumb.Section>
          <Breadcrumb.Divider icon="right chevron" />
          <Breadcrumb.Section active>{guild.name}</Breadcrumb.Section>
        </Breadcrumb>
        <Divider />
        <Container textAlign="center">
          <h1>Bots</h1>
          <BotInstanceList guild={guild as any} />
        </Container>
      </Container>
    );
  }
}

const GuildsShowPage = (props: RouteComponentProps<any>) => {
  return (
    <QueryRenderer
      query={query}
      variables={{
        guildId: props.match.params.guildId,
      }}
      environment={relayEnvironment}
      render={({ error, props: renderProps }) => {
        if (error) {
          throw error;
        }
        if (!renderProps) {
          return <Loader active />;
        }

        return <GuildsShowPageView guild={renderProps.guild} />;
      }}
    />
  );
};

export default withRouter(GuildsShowPage);
