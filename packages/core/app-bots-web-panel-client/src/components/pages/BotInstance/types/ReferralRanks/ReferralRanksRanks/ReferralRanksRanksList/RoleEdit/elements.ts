import { Icon, Label } from 'semantic-ui-react';
import styled from 'styled-components';

const getColor = ({ color }: { color?: number }) => {
  if (color === null || color === undefined || color === 0) {
    return '#666';
  }
  return `#${color.toString(16)}`;
};

export const RoleColorIndicator = styled.div`
  height: 14px;
  width: 14px;
  display: inline-block;
  margin: 0 1em;
  border-radius: 50%;
  background-color: ${getColor};
`;

export const StyledIcon = styled(Icon)`
  opacity: 0 !important;
`;

export const StyledLabel = styled(Label)`
  /* margin-right: 30px !important; */
  width: 100px !important;
`;

export const EditFields = styled.div`
  /* width: 200px; */
`;

export const StyledInput = styled.input`
  height: 26px;
  width: 100px;
`;

export const ActionsWrapper = styled.div`
  cursor: pointer;
`;
