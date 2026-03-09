/**
 * Componente de Input con validación integrada
 * Sprint K - Task K.3
 *
 * Uso con React Hook Form:
 * <FormInput
 *   label="Email"
 *   {...register('email')}
 *   error={errors.email?.message}
 * />
 */
import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';

// =============================================================================
// STYLED COMPONENTS
// =============================================================================
const FormGroup = styled.div<{ $hasError?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
`;

const Label = styled.label<{ $required?: boolean }>`
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
  font-weight: 500;

  ${props => props.$required && `
    &::after {
      content: ' *';
      color: ${theme.colors.error};
    }
  `}
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$hasError ? theme.colors.error : theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  color: ${theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? theme.colors.error : theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.$hasError
      ? `${theme.colors.error}20`
      : `${theme.colors.primary}20`};
  }

  &:disabled {
    background: ${theme.colors.bgMedium};
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$hasError ? theme.colors.error : theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  color: ${theme.colors.textPrimary};
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? theme.colors.error : theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.$hasError
      ? `${theme.colors.error}20`
      : `${theme.colors.primary}20`};
  }

  &:disabled {
    background: ${theme.colors.bgMedium};
    cursor: not-allowed;
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$hasError ? theme.colors.error : theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  color: ${theme.colors.textPrimary};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? theme.colors.error : theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.$hasError
      ? `${theme.colors.error}20`
      : `${theme.colors.primary}20`};
  }

  &:disabled {
    background: ${theme.colors.bgMedium};
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  font-size: 0.7rem;
  color: ${theme.colors.error};
  min-height: 1rem;
`;

const HelperText = styled.span`
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
`;

// =============================================================================
// TYPES
// =============================================================================
interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

type FormInputProps = BaseInputProps & React.InputHTMLAttributes<HTMLInputElement>;
type FormTextAreaProps = BaseInputProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;
type FormSelectProps = BaseInputProps & React.SelectHTMLAttributes<HTMLSelectElement> & {
  options?: Array<{ value: string | number; label: string }>;
  children?: React.ReactNode;
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Input con validación
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, ...props }, ref) => (
    <FormGroup $hasError={!!error}>
      {label && <Label $required={required}>{label}</Label>}
      <Input ref={ref} $hasError={!!error} {...props} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && helperText && <HelperText>{helperText}</HelperText>}
    </FormGroup>
  )
);
FormInput.displayName = 'FormInput';

/**
 * TextArea con validación
 */
export const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ label, error, helperText, required, ...props }, ref) => (
    <FormGroup $hasError={!!error}>
      {label && <Label $required={required}>{label}</Label>}
      <TextArea ref={ref} $hasError={!!error} {...props} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && helperText && <HelperText>{helperText}</HelperText>}
    </FormGroup>
  )
);
FormTextArea.displayName = 'FormTextArea';

/**
 * Select con validación
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, required, options, children, ...props }, ref) => (
    <FormGroup $hasError={!!error}>
      {label && <Label $required={required}>{label}</Label>}
      <Select ref={ref} $hasError={!!error} {...props}>
        {children || (
          <>
            <option value="">Seleccione...</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </>
        )}
      </Select>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && helperText && <HelperText>{helperText}</HelperText>}
    </FormGroup>
  )
);
FormSelect.displayName = 'FormSelect';

/**
 * Checkbox con validación
 */
interface FormCheckboxProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: ${theme.colors.textPrimary};
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, helperText, ...props }, ref) => (
    <FormGroup $hasError={!!error}>
      <CheckboxWrapper>
        <Checkbox ref={ref} type="checkbox" {...props} />
        {label && <CheckboxLabel>{label}</CheckboxLabel>}
      </CheckboxWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && helperText && <HelperText>{helperText}</HelperText>}
    </FormGroup>
  )
);
FormCheckbox.displayName = 'FormCheckbox';

export default FormInput;
