import React, { Component } from 'react';
import { WrappedFieldProps } from 'redux-form';
import { Select } from 'semantic-ui-react';

type Props = {
  [key: string]: any;
} & WrappedFieldProps;

export default class SemanticSelect extends Component<Props> {
  public handleChange = (event: any, val: any) => {
    this.props.input.onChange(val.value);
  };

  public render() {
    const { input, meta, ...rest } = this.props;
    const { error, touched } = meta;
    const hasError = !!error && touched;

    return (
      <Select
        value={input.value}
        error={hasError}
        onChange={this.handleChange}
        {...rest}
      />
    );
  }
}
