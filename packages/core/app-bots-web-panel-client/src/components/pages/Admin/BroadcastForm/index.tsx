import { map } from 'lodash';
import React, { Component } from 'react';
import { connect, DispatchProp } from 'react-redux';
import { compose } from 'recompose';
import { reduxForm, Field, InjectedFormProps } from 'redux-form';
import { Button, Form } from 'semantic-ui-react';
import SemanticFormField from '~/components/shared/SemanticFormField';
import { required } from '~/formValidators';
import adminSendBroadcast from '~/mutations/AdminSendBroadcast';
import { RootState } from '~/reducers';
import { BOT_TYPES } from '@overmindbots/shared-utils/constants';

type FormProps = {};
type OwnProps = {
  dispatch?: DispatchProp<any>;
};
type StateProps = {};
type FormValues = {
  readonly botType: string;
  readonly message: string;
};
type Props = OwnProps & StateProps & InjectedFormProps;

const botOptions = map(BOT_TYPES, botType => ({
  key: botType,
  value: botType,
  text: botType,
}));

class BroadcastFormView extends Component<FormProps & InjectedFormProps> {
  render() {
    const { invalid, handleSubmit } = this.props;
    return (
      <Form onSubmit={handleSubmit}>
        <Field
          label="Bot Type"
          component={SemanticFormField}
          as={Form.Select}
          options={botOptions}
          name="botType"
          validate={[required]}
          required
        />
        <Field
          label="Message to broadcast"
          component={SemanticFormField}
          as={Form.TextArea}
          name="message"
          validate={[required]}
          required
        />
        <Button disabled={invalid}>Send broadcast</Button>
      </Form>
    );
  }
}

class BroadcastForm extends Component<Props> {
  submit = (values: any) => {
    const { botType, message }: FormValues = values;
    const res = confirm(
      `Are you sure you want to submit a broadcast to "${botType}"`
    );
    if (!res) {
      return;
    }

    adminSendBroadcast({ botType, message });
  };
  render() {
    const { handleSubmit, ...rest } = this.props;
    return (
      <BroadcastFormView handleSubmit={handleSubmit(this.submit)} {...rest} />
    );
  }
}

const mapStateToProps = (state: RootState) => ({});

export default compose<Props, OwnProps>(
  reduxForm<FormValues>({ form: 'BroadcastForm' }),
  connect<StateProps, {}, {}, RootState>(mapStateToProps)
)(BroadcastForm);
