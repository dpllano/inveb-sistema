import styled, { css } from 'styled-components';
import { theme } from '../../theme';

interface SelectWrapperProps {
  $disabled?: boolean;
}

export const SelectWrapper = styled.div<SelectWrapperProps>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.6;
      pointer-events: none;
    `}
`;

export const Label = styled.label`
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
  color: ${theme.colors.textSecondary};
`;

export const StyledSelect = styled.select<{ $hasValue?: boolean; $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.sizes.body};
  color: ${theme.colors.textPrimary};
  background-color: ${({ $hasError }) => ($hasError ? '#fff5f5' : theme.colors.bgWhite)};
  border: 1px solid ${({ $hasError }) => ($hasError ? '#dc3545' : theme.colors.border)};
  border-radius: ${theme.radius.sm};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236C757D' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25rem;
  padding-right: 2.5rem;

  ${({ $hasValue, $hasError }) =>
    $hasValue && !$hasError &&
    css`
      border-color: ${theme.colors.accent};
      background-color: ${theme.colors.bgBlueLight}15;
    `}

  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
  }

  &:focus {
    outline: none;
    border-color: ${theme.colors.accent};
    box-shadow: 0 0 0 3px rgba(5, 193, 202, 0.15);
  }

  &:disabled {
    background-color: ${theme.colors.bgLight};
    cursor: not-allowed;
    opacity: 0.7;
  }

  option {
    padding: 0.5rem;
  }
`;

export const HelperText = styled.span<{ $error?: boolean }>`
  font-size: ${theme.typography.sizes.small};
  color: ${({ $error }) => ($error ? theme.colors.danger : theme.colors.textMuted)};
`;

interface CascadeSelectProps {
  label: string;
  value: string | number | null;
  options: Array<{ value: string | number; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  stepNumber?: number;
}

export function CascadeSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Seleccione...',
  helperText,
  error,
  stepNumber,
}: CascadeSelectProps) {
  return (
    <SelectWrapper $disabled={disabled}>
      <Label style={{ color: error ? '#dc3545' : undefined }}>
        {stepNumber && <StepBadge>{stepNumber}</StepBadge>}
        {label}
      </Label>
      <StyledSelect
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        $hasValue={value !== null && value !== ''}
        $hasError={error}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
      {helperText && <HelperText $error={error}>{helperText}</HelperText>}
    </SelectWrapper>
  );
}

const StepBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  margin-right: ${theme.spacing.xs};
  background-color: ${theme.colors.primary};
  color: ${theme.colors.textWhite};
  border-radius: ${theme.radius.full};
  font-size: ${theme.typography.sizes.tiny};
  font-weight: ${theme.typography.weights.semibold};
`;
