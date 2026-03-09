/**
 * SearchableSelect Component
 * Dropdown con búsqueda integrada - Similar a Select2 de Laravel
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const SelectButton = styled.div<{ $isOpen: boolean; $disabled: boolean }>`
  padding: 0.5rem;
  border: 1px solid ${props => props.$isOpen ? '#17a2b8' : '#ddd'};
  border-radius: 4px;
  font-size: 0.85rem;
  background: ${props => props.$disabled ? '#f5f5f5' : 'white'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 38px;
  color: ${props => props.$disabled ? '#666' : '#333'};

  ${props => props.$isOpen && `
    box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.15);
  `}

  &:hover {
    border-color: ${props => props.$disabled ? '#ddd' : '#17a2b8'};
  }
`;

const SelectedText = styled.span<{ $isPlaceholder: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  color: ${props => props.$isPlaceholder ? '#999' : 'inherit'};
`;

const Arrow = styled.span<{ $isOpen: boolean }>`
  margin-left: 0.5rem;
  transition: transform 0.2s;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  color: #666;
`;

const Dropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #17a2b8;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 1000;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow: hidden;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-bottom: 1px solid #eee;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-bottom-color: #17a2b8;
  }
`;

const OptionsList = styled.div`
  max-height: 250px;
  overflow-y: auto;
`;

const Option = styled.div<{ $isSelected: boolean; $isHighlighted: boolean }>`
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  background: ${props => {
    if (props.$isSelected) return '#e3f2fd';
    if (props.$isHighlighted) return '#f5f5f5';
    return 'white';
  }};
  color: ${props => props.$isSelected ? '#17a2b8' : '#333'};

  &:hover {
    background: ${props => props.$isSelected ? '#e3f2fd' : '#f5f5f5'};
  }
`;

const NoResults = styled.div`
  padding: 0.75rem;
  text-align: center;
  color: #666;
  font-size: 0.85rem;
`;

interface SearchableSelectProps<T> {
  options: T[];
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  getOptionValue: (option: T) => number | string;
  getOptionLabel: (option: T) => string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function SearchableSelect<T>({
  options,
  value,
  onChange,
  getOptionValue,
  getOptionLabel,
  placeholder = 'Seleccionar...',
  disabled = false,
  loading = false,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find selected option
  const selectedOption = options.find(opt => getOptionValue(opt) === value);
  const displayText = selectedOption ? getOptionLabel(selectedOption) : placeholder;

  // Filter options based on search
  const filteredOptions = options.filter(opt =>
    getOptionLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  const handleToggle = useCallback(() => {
    if (!disabled && !loading) {
      setIsOpen(prev => !prev);
      if (!isOpen) {
        setSearch('');
      }
    }
  }, [disabled, loading, isOpen]);

  const handleSelect = useCallback((option: T) => {
    onChange(getOptionValue(option));
    setIsOpen(false);
    setSearch('');
  }, [onChange, getOptionValue]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        break;
    }
  }, [isOpen, highlightedIndex, filteredOptions, handleSelect]);

  return (
    <Container ref={containerRef}>
      <SelectButton
        onClick={handleToggle}
        $isOpen={isOpen}
        $disabled={disabled || loading}
      >
        <SelectedText $isPlaceholder={!selectedOption}>
          {loading ? 'Cargando...' : displayText}
        </SelectedText>
        {selectedOption && !disabled && (
          <span
            onClick={handleClear}
            style={{ marginRight: '0.5rem', color: '#999', cursor: 'pointer' }}
          >
            ×
          </span>
        )}
        <Arrow $isOpen={isOpen}>▼</Arrow>
      </SelectButton>

      <Dropdown $isOpen={isOpen}>
        <SearchInput
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar..."
        />
        <OptionsList>
          <Option
            $isSelected={!value}
            $isHighlighted={highlightedIndex === -1}
            onClick={() => {
              onChange(null);
              setIsOpen(false);
              setSearch('');
            }}
          >
            -
          </Option>
          {filteredOptions.length === 0 ? (
            <NoResults>No se encontraron resultados</NoResults>
          ) : (
            filteredOptions.map((option, index) => (
              <Option
                key={getOptionValue(option)}
                $isSelected={getOptionValue(option) === value}
                $isHighlighted={index === highlightedIndex}
                onClick={() => handleSelect(option)}
              >
                {getOptionLabel(option)}
              </Option>
            ))
          )}
        </OptionsList>
      </Dropdown>
    </Container>
  );
}
