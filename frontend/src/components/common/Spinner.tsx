import styled, { keyframes } from 'styled-components';
import { theme } from '../../theme';

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

interface SpinnerProps {
  $size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
};

export const Spinner = styled.div<SpinnerProps>`
  width: ${({ $size = 'md' }) => sizes[$size]};
  height: ${({ $size = 'md' }) => sizes[$size]};
  border: 2px solid ${theme.colors.bgLight};
  border-top-color: ${theme.colors.accent};
  border-radius: ${theme.radius.full};
  animation: ${spin} 0.8s linear infinite;
`;

export const SpinnerOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
`;

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <SpinnerOverlay>
      <Spinner $size={size} />
    </SpinnerOverlay>
  );
}
