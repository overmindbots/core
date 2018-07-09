import React, { Component } from 'react';
import { connect, Dispatch } from 'react-redux';
import { push } from 'react-router-redux';
import { Loader } from 'semantic-ui-react';

interface Props {
  location: Location;
  dispatch: Dispatch<any>;
}

class DiscordLoginCallbackPage extends Component<Props> {
  componentDidMount() {
    this.props.dispatch(push('/'));
  }
  render() {
    return <Loader active />;
  }
}

export default connect(null)(DiscordLoginCallbackPage);
