import { each, get, isNull, isUndefined } from 'lodash';
import React from 'react';
import { AssertionError } from '~/errors';

/* FIXME: This should correctly tell TypeScript the type returned is not null */

interface HocArgs {
  propPaths: [string];
}

export default ({ propPaths }: HocArgs) => <P extends {}>(
  WrappedComponent: React.ComponentType<P>
) => {
  class AssertPropsHOC extends React.Component<P> {
    render() {
      each(propPaths, propPath => {
        const propVal = get(this.props, propPath);
        if (isNull(propVal) || isUndefined(propVal)) {
          throw new AssertionError(
            `Prop with path "${propPath}" Is Null or Undefined`
          );
        }
      });

      return <WrappedComponent {...this.props} />;
    }
  }
  return AssertPropsHOC;
};
