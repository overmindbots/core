import React, { ChangeEvent, Component } from 'react';
import { WrappedFieldProps } from 'redux-form';
import { Form, Label } from 'semantic-ui-react';

type Props = {
  label?: string;
  as: any;
  errorText?: string;
  [key: string]: any;
} & WrappedFieldProps;

export default class SemanticFormField extends Component<Props> {
  public handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.props.input.onChange(event.target.value);
  };

  public render() {
    const {
      input,
      label,
      as: As,
      meta,
      errorText,
      placeholder,
      maxLength,
      type = 'text',
      semanticComponent,
      min,
      max,
      ...rest
    } = this.props;
    const { error, touched } = meta;
    const hasError = !!error && touched;
    const errorLabelPointing = rest.inline ? 'left' : true;
    const errorLabel =
      hasError && error.length ? (
        <Label basic color="red" pointing={errorLabelPointing}>
          {error}
        </Label>
      ) : null;
    let FieldComponent = Form.Field;
    if (semanticComponent) {
      FieldComponent = semanticComponent;
    }
    return (
      <FieldComponent error={hasError} {...rest}>
        <label>{label}</label>
        <input
          {...input}
          min={min}
          max={max}
          placeholder={placeholder}
          type={type}
          maxLength={maxLength}
          onChange={this.handleChange}
        />
        {errorLabel}
      </FieldComponent>
    );
  }
}
