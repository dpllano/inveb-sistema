/**
 * Modal Component
 * Componente de modal reutilizable con estilos Monitor One
 */

import { ReactNode, useEffect, useCallback } from 'react';
import styled from 'styled-components';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  z-index: 1000;
  overflow-y: auto;
`;

const ModalContainer = styled.div<{ $size: string }>`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: ${props => {
    switch (props.$size) {
      case 'sm': return '400px';
      case 'md': return '600px';
      case 'lg': return '800px';
      case 'xl': return '1140px';
      default: return '600px';
    }
  }};
  max-height: calc(100vh - 4rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
  background: #f2f4fd;
`;

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  showCloseButton = true
}: ModalProps) {

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <Overlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContainer $size={size}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {showCloseButton && (
            <CloseButton onClick={onClose}>&times;</CloseButton>
          )}
        </ModalHeader>
        <ModalBody>
          {children}
        </ModalBody>
      </ModalContainer>
    </Overlay>
  );
}
