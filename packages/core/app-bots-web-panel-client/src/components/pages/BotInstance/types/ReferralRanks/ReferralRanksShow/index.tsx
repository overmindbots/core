import React, { Component } from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  Card,
  Container,
  Divider,
  Icon,
  SemanticICONS,
} from 'semantic-ui-react';
import { ReferralRanksShow_botInstance } from '~/__generated__/ReferralRanksShow_botInstance.graphql';

import { CardIconWrapper } from './elements';

export interface RelayProps {
  botInstance: ReferralRanksShow_botInstance;
}

const IndexCard = ({
  name,
  icon,
  path,
}: {
  name: string;
  icon: SemanticICONS;
  path: string;
}) => (
  <Card as={Link} to={`${path}`}>
    <CardIconWrapper>
      <Icon circular fitted name={icon} width="100%" size="huge" />
    </CardIconWrapper>
    <Card.Content>
      <Card.Header textAlign="center">{name}</Card.Header>
    </Card.Content>
  </Card>
);

class ReferralRanksShowView extends Component<RelayProps> {
  render() {
    const { botInstance } = this.props;
    const { guild, id: botInstanceId } = botInstance;

    return (
      <Container>
        <Breadcrumb size="huge">
          <Breadcrumb.Section as={Link} to={`/`} link>
            Dashboard
          </Breadcrumb.Section>
          <Breadcrumb.Divider icon="right chevron" />
          <Breadcrumb.Section as={Link} to={`/guilds/${guild.id}`} link>
            {guild.name}
          </Breadcrumb.Section>
          <Breadcrumb.Divider icon="right chevron" />
          <Breadcrumb.Section active>{botInstance.name}</Breadcrumb.Section>
        </Breadcrumb>
        <Divider />
        <h1>{botInstance.name} Panel</h1>
        <Card.Group itemsPerRow={3}>
          <IndexCard
            name="Settings"
            icon="setting"
            path={`/botInstances/${botInstanceId}/settings`}
          />
          <IndexCard
            name="Ranks"
            icon="star"
            path={`/botInstances/${botInstanceId}/ranks`}
          />
        </Card.Group>
      </Container>
    );
  }
}

export default createFragmentContainer(
  ReferralRanksShowView,
  graphql`
    fragment ReferralRanksShow_botInstance on ReferralRanks {
      id
      name
      guild {
        id
        name
      }
    }
  `
);
