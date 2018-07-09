import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

const ImageIconBase = css`
  width: 100px;
  height: 100px;
  background-color: #888;
  border-radius: 50%;
  margin: 1em;
`;

export const NoImageIcon = styled.div`
  ${ImageIconBase};
`;

export const ImageIcon = styled.img`
  ${ImageIconBase};
`;

export const GuildItem = styled(Link)`
  display: flex;
  flex-flow: column;
  align-items: center;
`;

export const GuildItemName = styled.div`
  text-align: center;
  color: #666;
`;
