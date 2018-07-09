import { Link, LinkProps } from 'react-router-dom';
import styled, { css } from 'styled-components';

interface BotInstanceProps {
  botEnabled?: boolean;
  href?: string;
}
const BotInstanceStyles = css`
  display: flex;
  width: 200px;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;

  & > span {
    color: #888;
    font-size: 1.2em;
    margin-top: 0.5em;
    transition: color 0.15s ease-in;
  }
  & > img {
    height: auto;
    width: 50%;
    transition: filter 0.15s ease-in;
    filter: ${({ botEnabled }: { botEnabled: boolean }) => {
      return !botEnabled ? 'grayscale(1)' : '';
    }};
  }
  &:hover {
    & > img {
      filter: grayscale(0);
    }
    & > span {
      color: #333;
    }
  }
`;

export const BotInstanceExternalLink = styled.a`
  ${BotInstanceStyles};
`;
export const BotInstanceInternalLink = styled<LinkProps & BotInstanceProps>(
  Link
)`
  ${BotInstanceStyles};
`;
