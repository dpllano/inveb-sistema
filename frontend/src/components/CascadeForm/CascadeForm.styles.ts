import styled from 'styled-components';
import { theme } from '../../theme';

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing.lg};
`;

// Grid simple de 3 columnas para sección 6 (coincide con Laravel)
export const SimpleFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.md};

  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const SectionTitle = styled.h3`
  font-size: ${theme.typography.sizes.h4};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.sm};
  padding-bottom: ${theme.spacing.xs};
  border-bottom: 2px solid ${theme.colors.accent};
`;

export const StatusBadge = styled.span<{ $status: 'valid' | 'invalid' | 'pending' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};

  ${({ $status }) => {
    switch ($status) {
      case 'valid':
        return `
          background-color: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `;
      case 'invalid':
        return `
          background-color: ${theme.colors.danger}20;
          color: ${theme.colors.danger};
        `;
      default:
        return `
          background-color: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
        `;
    }
  }}
`;

export const ProgressBar = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.md};
`;

export const ProgressStep = styled.div<{ $active: boolean; $completed: boolean }>`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  transition: background-color ${theme.transitions.normal};

  ${({ $active, $completed }) => {
    if ($completed) {
      return `background-color: ${theme.colors.success};`;
    }
    if ($active) {
      return `background-color: ${theme.colors.accent};`;
    }
    return `background-color: ${theme.colors.border};`;
  }}
`;

export const RulesDisplay = styled.div`
  background-color: ${theme.colors.bgLight};
  border-radius: ${theme.radius.md};
  padding: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
`;

export const RuleItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.xs} 0;
  font-size: ${theme.typography.sizes.small};
  color: ${theme.colors.textSecondary};

  &:not(:last-child) {
    border-bottom: 1px dashed ${theme.colors.border};
  }
`;

export const RuleCode = styled.code`
  background-color: ${theme.colors.primary}15;
  color: ${theme.colors.primary};
  padding: 2px 6px;
  border-radius: ${theme.radius.sm};
  font-size: ${theme.typography.sizes.tiny};
  font-weight: ${theme.typography.weights.medium};
`;
