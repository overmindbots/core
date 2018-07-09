import React, { Component } from 'react';
import Navbar from '~/components/Navbar';

import { ContentWrapper, HeaderWrapper, Wrapper } from './elements';

export default class MainLayout extends Component {
  render() {
    return (
      <Wrapper>
        <HeaderWrapper>
          <Navbar />
        </HeaderWrapper>
        <ContentWrapper>{this.props.children}</ContentWrapper>
      </Wrapper>
    );
  }
}
