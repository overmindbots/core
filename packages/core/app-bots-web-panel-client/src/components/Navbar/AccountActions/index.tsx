import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Dropdown, Image, MenuItem } from 'semantic-ui-react';
import { DISCORD_CDN_URL } from '~/constants';
import logoutMutation from '~/mutations/Logout';
import { State as SessionState } from '~/reducers/session';
import { User as UserModel } from '~/types/models';

interface LoggedInAccountActionsP {
  logout: () => void;
  user: UserModel;
}
interface ViewP {
  user: UserModel;
  logout: () => void;
}
interface AccountActionsContainerP {
  user: UserModel;
  dispatch: Dispatch<any>;
}

export const LoggedOutAccountActions = () => (
  <MenuItem as={Link} to="login">
    Log In
  </MenuItem>
);

export const LoggedInAccountActions = (props: LoggedInAccountActionsP) => {
  const { user, logout } = props;
  const { avatar, discordId } = user;
  const imageUrl = avatar
    ? `${DISCORD_CDN_URL}/avatars/${discordId}/${avatar}.png?size=100px`
    : '';
  return (
    <Dropdown
      item
      trigger={
        <span>
          {user.avatar ? <Image avatar src={imageUrl} /> : null}
          <span style={{ marginLeft: '10px' }}>{user.displayName}</span>
        </span>
      }
    >
      <Dropdown.Menu>
        <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export const View = ({ user, logout }: ViewP) => {
  if (!user) {
    return <LoggedOutAccountActions />;
  }
  return <LoggedInAccountActions logout={logout} user={user} />;
};

const mapStateToProps = ({ session }: { session: SessionState }) => ({
  user: session.user,
});

class AccountActionsContainer extends Component<AccountActionsContainerP> {
  logout = () => {
    logoutMutation();
  };

  render() {
    return <View logout={this.logout} user={this.props.user} />;
  }
}

export default connect(mapStateToProps)(AccountActionsContainer);
