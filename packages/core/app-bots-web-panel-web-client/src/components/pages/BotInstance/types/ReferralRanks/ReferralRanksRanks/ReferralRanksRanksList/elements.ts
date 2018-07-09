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

export const RanksList = styled.div``;

export const RanksListItem = styled.div`
  display: flex;
  width: 100%;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  padding: 5px;
  border-bottom: 1px solid #eee;
  &:last-child {
    margin-bottom: 20px;
  }
  &:hover {
    background-color: #f5f5f5;
  }
`;

export const RoleName = styled.div`
  color: #333;
  font-weight: bold;
`;

export const RankInvitesRequired = styled.div`
  color: #333;
  font-weight: normal;
  margin-right: 10px;
`;

export const RankActions = styled.div``;

export const Splitter = styled.div`
  flex-grow: 1;
`;
