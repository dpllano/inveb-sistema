import styled, { css } from 'styled-components';
import { theme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $fullWidth?: boolean;
}

const variants = {
  primary: css`
    background-color: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
    color: ${theme.colors.textWhite};

    &:hover:not(:disabled) {
      background-color: ${theme.colors.linkHover};
      border-color: ${theme.colors.linkHover};
    }
  `,
  secondary: css`
    background-color: ${theme.colors.secondary};
    border-color: ${theme.colors.secondary};
    color: ${theme.colors.textWhite};

    &:hover:not(:disabled) {
      background-color: #d4631f;
      border-color: #d4631f;
    }
  `,
  outline: css`
    background-color: transparent;
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};

    &:hover:not(:disabled) {
      background-color: ${theme.colors.primary};
      color: ${theme.colors.textWhite};
    }
  `,
  danger: css`
    background-color: ${theme.colors.danger};
    border-color: ${theme.colors.danger};
    color: ${theme.colors.textWhite};

    &:hover:not(:disabled) {
      background-color: #c82333;
      border-color: #c82333;
    }
  `,
};

const sizes = {
  sm: css`
    padding: 0.375rem 0.75rem;
    font-size: ${theme.typography.sizes.small};
  `,
  md: css`
    padding: 0.5rem 1.25rem;
    font-size: ${theme.typography.sizes.body};
  `,
  lg: css`
    padding: 0.75rem 1.5rem;
    font-size: ${theme.typography.sizes.h4};
  `,
};

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.xs};
  font-family: ${theme.typography.fontFamily};
  font-weight: ${theme.typography.weights.medium};
  border: 2px solid;
  border-radius: ${theme.radius.sm};
  cursor: pointer;
  transition: all ${theme.transitions.normal};

  ${({ $variant = 'primary' }) => variants[$variant]}
  ${({ $size = 'md' }) => sizes[$size]}
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}

  &:disabled {
    background-color: ${theme.colors.disabled};
    border-color: ${theme.colors.disabled};
    color: ${theme.colors.textWhite};
    cursor: not-allowed;
    opacity: 0.7;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(5, 193, 202, 0.25);
  }
`;
