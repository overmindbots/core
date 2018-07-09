import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Container, Menu } from 'semantic-ui-react';
import { RootState } from '~/reducers';

import NavbarAccountActions from './AccountActions';

interface NavbarP {
  isLoggedIn: boolean;
  isAdmin: boolean;
}
interface NavbarViewP {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

class NavbarView extends Component<NavbarViewP> {
  renderLoggedInItems = () => {
    return (
      <Fragment>
        <Menu.Item as={Link} to="/">
          Dashboard
        </Menu.Item>
      </Fragment>
    );
  };
  renderLoggedOutItems = () => {
    return (
      <Menu.Item as={Link} to="/login">
        Login
      </Menu.Item>
    );
  };
  renderAdminItems = () => {
    return (
      <Menu.Item as={Link} to="/admin">
        Admin
      </Menu.Item>
    );
  };

  render() {
    const { isLoggedIn, isAdmin } = this.props;

    return (
      <Menu style={{ height: '60px' }} fixed="top" inverted>
        <Container>
          <Menu.Item as={Link} to="/" header>
            <b>Bot Alchemy</b>{' '}
            <span
              style={{ fontSize: '10px', color: '#aaa', marginLeft: '5px' }}
            >
              ALPHA
            </span>
          </Menu.Item>
          {isLoggedIn
            ? this.renderLoggedInItems()
            : this.renderLoggedOutItems()}
          {isAdmin ? this.renderAdminItems() : null}
          <Menu.Menu position="right">
            <NavbarAccountActions />
          </Menu.Menu>
        </Container>
      </Menu>
    );
  }
}

const Navbar = ({ isLoggedIn, isAdmin }: NavbarP) => (
  <NavbarView isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
);

const mapStateToProps = ({ session: { user } }: RootState) => ({
  isLoggedIn: !!user,
  isAdmin: !!user && user.isAdmin,
});

export default connect(mapStateToProps)(Navbar);
