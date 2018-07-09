import React, { Component, StatelessComponent } from 'react';
import { connect } from 'react-redux';
import { createFragmentContainer, graphql } from 'react-relay';
import { compose } from 'recompose';
import { reduxForm, Field, InjectedFormProps } from 'redux-form';
import {
  Breadcrumb,
  Button,
  Container,
  Divider,
  Form,
} from 'semantic-ui-react';
import SemanticFormField from '~/components/shared/SemanticFormField';
import { length, required } from '~/formValidators';
import { PREFIX_PATTERN } from '@overmindbots/shared-utils/constants';

import { Link } from 'react-router-dom';
import { ReferralRanksSettings_botInstance } from '~/__generated__/ReferralRanksSettings_botInstance.graphql';
import referralRanksUpdate from '~/mutations/ReferralRanksUpdate';

export interface RelayProps {
  botInstance: ReferralRanksSettings_botInstance;
}
interface FormValues {
  id: string;
  config: {
    prefix: string;
  };
}
type Props = RelayProps & InjectedFormProps;

const validatePrefix = (value: string) => {
  if (!PREFIX_PATTERN.test(value)) {
    return (
      'Invalid prefix, prefix cannot contain letters, numbers, quotes,' +
      ' "@" or "#".'
    );
  }
  return undefined;
};

const validatePrefixMaxLength = length({ max: 1 });

export const ReferralRanksSettingsView: StatelessComponent<
  InjectedFormProps & RelayProps
> = ({ handleSubmit, botInstance, pristine, invalid }) => (
  <Container>
    <Breadcrumb size="huge">
      <Breadcrumb.Section as={Link} to={`/`} link>
        Dashboard
      </Breadcrumb.Section>
      <Breadcrumb.Divider icon="right chevron" />
      <Breadcrumb.Section as={Link} to={`/guilds/${botInstance.guild.id}`} link>
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
    <Form onSubmit={handleSubmit}>
      <Field
        name="config.prefix"
        component={SemanticFormField}
        as={Form.Input}
        type="text"
        validate={[required, validatePrefixMaxLength, validatePrefix]}
        label="Prefix"
        placeholder="The character you use for your comands, like ! or $"
        inline
        maxLength={1}
      />
      <Container textAlign="right">
        <Button as={Link} to={`/botInstances/${botInstance.id}`}>
          Back
        </Button>
        <Button primary disabled={pristine || invalid}>
          Save
        </Button>
      </Container>
      <br />
    </Form>
  </Container>
);

class ReferralRanksSettings extends Component<Props & InjectedFormProps> {
  public submit = async (values: any) => {
    const {
      botInstance: { id },
    } = this.props;
    const { config } = values as FormValues;

    const { errors } = await referralRanksUpdate({ id, config });

    // TODO: Display back-end error here. This will only happen if
    // some client validation didn't catch an invalid field
    if (errors) {
      throw errors;
    }
  };

  public render() {
    const { handleSubmit, ...rest } = this.props;
    return (
      <ReferralRanksSettingsView
        handleSubmit={handleSubmit(this.submit)}
        {...rest}
      />
    );
  }
}
const mapProps = (state: any, { botInstance }: RelayProps) => ({
  initialValues: botInstance,
  botInstance,
});

export default createFragmentContainer(
  compose<Props, RelayProps>(
    connect(mapProps),
    reduxForm<FormValues>({ form: 'ReferralRanksSettings' })
  )(ReferralRanksSettings),
  graphql`
    fragment ReferralRanksSettings_botInstance on ReferralRanks {
      id
      name
      guildDiscordId
      config {
        prefix
      }
      guild {
        id
        name
      }
    }
  `
);
