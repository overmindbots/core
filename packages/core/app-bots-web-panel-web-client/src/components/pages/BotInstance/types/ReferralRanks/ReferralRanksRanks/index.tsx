import React, { StatelessComponent } from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { Link } from 'react-router-dom';
import { Breadcrumb, Container, Divider } from 'semantic-ui-react';
import { ReferralRanksRanks_botInstance } from '~/__generated__/ReferralRanksRanks_botInstance.graphql';
import { ReferralRanksRanksList_botInstance } from '~/__generated__/ReferralRanksRanksList_botInstance.graphql';

import ReferralRanksRanksList from './ReferralRanksRanksList';

export interface RelayProps {
  botInstance: ReferralRanksRanks_botInstance &
    ReferralRanksRanksList_botInstance;
}

const ReferralRanksRanks: StatelessComponent<RelayProps> = ({
  botInstance,
  botInstance: { guild },
}) => (
  <Container>
    <Breadcrumb size="huge">
      <Breadcrumb.Section as={Link} to={`/`} link>
        Dashboard
      </Breadcrumb.Section>
      <Breadcrumb.Divider icon="right chevron" />
      <Breadcrumb.Section as={Link} to={`/guilds/${guild.id}`} link>
        {botInstance.guild.name}
      </Breadcrumb.Section>
      <Breadcrumb.Divider icon="right chevron" />
      <Breadcrumb.Section as={Link} to={`/botInstances/${botInstance.id}`}>
        {botInstance.name}
      </Breadcrumb.Section>
      <Breadcrumb.Divider icon="right arrow" />
      <Breadcrumb.Section active>Ranks</Breadcrumb.Section>
    </Breadcrumb>
    <Divider />
    <h1>Ranks in your server</h1>
    <ReferralRanksRanksList botInstance={botInstance} />
  </Container>
);

export default createFragmentContainer(
  ReferralRanksRanks,
  graphql`
    fragment ReferralRanksRanks_botInstance on ReferralRanks {
      id
      name
      guild {
        id
        name
      }
      ...ReferralRanksRanksList_botInstance
    }
  `
);
