import React from 'react';
import { Button } from 'semantic-ui-react';
import { DISCORD_OAUTH_URL } from '~/constants';

import { Wrapper } from './elements';

const LoginPage = () => (
  <Wrapper>
    <Button as="a" href={`${DISCORD_OAUTH_URL}`}>
      Login with Discord
    </Button>
  </Wrapper>
);

export default LoginPage;
