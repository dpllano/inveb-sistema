import styled from 'styled-components';
import { theme } from '../../theme';

export const Card = styled.div`
  background-color: ${theme.colors.bgWhite};
  border-radius: ${theme.radius.md};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
`;

export const CardHeader = styled.div`
  background-color: ${theme.colors.cardHeader};
  color: ${theme.colors.textWhite};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  font-size: ${theme.typography.sizes.h4};
  font-weight: ${theme.typography.weights.semibold};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

export const CardBody = styled.div`
  padding: ${theme.spacing.lg};
`;

export const CardFooter = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  background-color: ${theme.colors.bgLight};
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
`;
