import { createGlobalStyle } from 'styled-components';
import { theme } from './index';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.sizes.body};
    font-weight: ${theme.typography.weights.regular};
    line-height: ${theme.typography.lineHeights.normal};
    color: ${theme.colors.textPrimary};
    background-color: ${theme.colors.bgLight};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${theme.typography.weights.semibold};
    line-height: ${theme.typography.lineHeights.tight};
    color: ${theme.colors.textPrimary};
    margin-bottom: ${theme.spacing.md};
  }

  h1 { font-size: ${theme.typography.sizes.h1}; }
  h2 { font-size: ${theme.typography.sizes.h2}; }
  h3 { font-size: ${theme.typography.sizes.h3}; }
  h4 { font-size: ${theme.typography.sizes.h4}; }

  a {
    color: ${theme.colors.link};
    text-decoration: none;
    transition: color ${theme.transitions.fast};

    &:hover {
      color: ${theme.colors.linkHover};
    }
  }

  button {
    font-family: ${theme.typography.fontFamily};
    cursor: pointer;
  }

  input, select, textarea {
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.sizes.body};
  }

  #root {
    min-height: 100vh;
  }
`;
