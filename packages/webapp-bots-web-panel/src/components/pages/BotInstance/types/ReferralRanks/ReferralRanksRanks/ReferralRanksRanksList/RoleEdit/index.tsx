import React, { Component, StatelessComponent } from 'react';
import onClickOutside, {
  InjectedOnClickOutProps,
  OnClickOutProps,
} from 'react-onclickoutside';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { reduxForm, Field, InjectedFormProps, SubmitHandler } from 'redux-form';
import {
  Button,
  Form,
  FormGroup,
  Icon,
  Label,
  LabelDetail,
  Message,
  Popup,
  Table,
} from 'semantic-ui-react';
import SemanticFormField from '~/components/shared/SemanticFormField';
import referralRanksSetRank from '~/mutations/ReferralRanksSetRank';

import {
  ActionsWrapper,
  EditFields as EditFieldsView,
  RoleColorIndicator,
} from './elements';

export interface RoleType {
  name: string;
  color: number;
  discordId: string;
  managed: boolean;
}
export interface RankType {
  id: string;
  roleDiscordId: string;
  invitesRequired: number;
}
interface OwnProps {
  onCancel: () => void;
  onEdit: () => void;
  form: string;
  rank?: RankType;
  isRoleBeingEdited: boolean;
  role: RoleType;
  belowBotRole: boolean;
  botInstanceId: string;
}
interface FormValues {
  invitesRequired: number;
  roleDiscordId: string;
}
type Props = InjectedFormProps & OwnProps;

interface EditFieldsRawProps {
  onCancel: (...args: any[]) => any;
}
class EditFieldsRaw extends Component<
  EditFieldsRawProps & OnClickOutProps & InjectedOnClickOutProps
> {
  handleClickOutside = (evt: any) => {
    this.props.onCancel();
  };

  render() {
    return <EditFieldsView>{this.props.children}</EditFieldsView>;
  }
}

const EditFields = onClickOutside(EditFieldsRaw);
const RoleEditFields: StatelessComponent<{
  onCancel: () => void;
  handleSubmit: SubmitHandler;
  handleClearSubmit: SubmitHandler;
}> = ({ onCancel, handleSubmit, handleClearSubmit }) => (
  <EditFields onCancel={onCancel}>
    <Form size="mini" onSubmit={handleSubmit}>
      <FormGroup inline>
        <Field
          autoFocus
          component={SemanticFormField}
          name="invitesRequired"
          type="number"
          as={Form.Field}
          min={1}
          max={10000}
        />
        <Button size="mini" icon primary>
          <Icon name="check" /> Save
        </Button>
        <Button size="mini" onClick={handleClearSubmit} icon secondary>
          <Icon name="eraser" /> Clear
        </Button>
      </FormGroup>
    </Form>
  </EditFields>
);

type ReferralRanksRankEditViewProps = InjectedFormProps &
  Props &
  OwnProps & { handleClearSubmit: () => void };

class ReferralRanksRankEditView extends Component<
  ReferralRanksRankEditViewProps
> {
  render() {
    const {
      handleSubmit,
      handleClearSubmit,
      onCancel,
      onEdit,
      isRoleBeingEdited,
      rank,
      role,
      belowBotRole,
    } = this.props;
    const isInvalid = !belowBotRole && !!rank;
    let actions;

    if (rank) {
      if (!belowBotRole) {
        actions = (
          <Message negative size="mini">
            <Icon name="exclamation triangle" /> Role has invites but is not
            below bot
          </Message>
        );
      } else {
        actions = (
          <ActionsWrapper>
            {!isRoleBeingEdited ? (
              <Popup
                trigger={
                  <Label color="orange" onClick={onEdit}>
                    invites <LabelDetail>{rank.invitesRequired}</LabelDetail>
                  </Label>
                }
                position="left center"
                size="mini"
                content="Edit invites"
              />
            ) : null}
            {isRoleBeingEdited ? (
              <RoleEditFields
                handleClearSubmit={handleClearSubmit}
                onCancel={onCancel}
                handleSubmit={handleSubmit}
              />
            ) : null}
          </ActionsWrapper>
        );
      }
    } else {
      if (!belowBotRole) {
        actions = (
          <Popup
            trigger={<Icon disabled name="question circle outline" />}
            content="Cannot set required invites to this role, move it below the bot in your Discord's server settings"
            size="mini"
          />
        );
      } else {
        actions = (
          <ActionsWrapper>
            {!isRoleBeingEdited ? (
              <Label color="blue" onClick={onEdit}>
                Set invites
              </Label>
            ) : null}
            {isRoleBeingEdited ? (
              <RoleEditFields
                onCancel={onCancel}
                handleClearSubmit={handleClearSubmit}
                handleSubmit={handleSubmit}
              />
            ) : null}
          </ActionsWrapper>
        );
      }
    }

    return (
      <Table.Row error={isInvalid}>
        <Table.Cell disabled={!belowBotRole && !isInvalid}>
          <RoleColorIndicator color={role.color as any} />
          {role.name}
        </Table.Cell>
        <Table.Cell textAlign="right" collapsing>
          {actions}
        </Table.Cell>
      </Table.Row>
    );
  }
}

class ReferralRanksRankEdit extends Component<Props & InjectedFormProps> {
  public submit = async (values: any) => {
    const { onCancel, botInstanceId, rank } = this.props;
    const { roleDiscordId, invitesRequired } = values;

    onCancel();

    const { errors } = await referralRanksSetRank({
      roleDiscordId,
      invitesRequired,
      botInstanceId,
      originalRank: rank,
    });

    if (errors) {
      throw errors;
    }
  };
  public clearSubmit = async (values: any) => {
    const moddedValues = { ...values, invitesRequired: -1 };
    const res = await this.submit(moddedValues);
    return res;
  };
  render() {
    const {
      rank,
      handleSubmit,
      botInstanceId,
      onCancel,
      onEdit,
      ...rest
    } = this.props;
    return (
      <ReferralRanksRankEditView
        onCancel={onCancel}
        onEdit={onEdit}
        botInstanceId={botInstanceId}
        rank={rank}
        handleClearSubmit={handleSubmit(this.clearSubmit)}
        handleSubmit={handleSubmit(this.submit)}
        {...rest}
      />
    );
  }
}

const mapProps = (state: any, { rank, role }: OwnProps) => {
  const invitesRequired = rank && rank.invitesRequired;
  const { discordId: roleDiscordId } = role;

  return {
    initialValues: {
      invitesRequired,
      roleDiscordId,
    },
    rank,
  };
};

export default compose<Props, OwnProps>(
  connect(mapProps),
  reduxForm<FormValues>({
    form: 'ReferralRanksRankEdit',
    enableReinitialize: true,
  })
)(ReferralRanksRankEdit);
