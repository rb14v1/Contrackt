import React from 'react';
import styled from 'styled-components';

/* UPDATED OVERLAY — WHITE instead of BLACK */
const ModalOverlay = styled.div`
  display: ${props => (props.$isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.55);  /* Light white overlay */
  backdrop-filter: blur(4px);             /* Soft blur for premium UI */
  z-index: 1000;
  justify-content: center;
  align-items: center;
`;

/* UPDATED CONTENT — WHITE + TEAL BORDER */
const ModalContent = styled.div`
  background: #ffffff;                     /* Pure white background */
  padding: 35px;
  border-radius: 16px;
  max-width: 650px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  border: 3px solid #12A2A9;               /* TEAL BORDER */
  position: relative;
  color: #222;                             /* Dark clean text */
  max-height: 80vh;
  overflow-y: auto;
`;

/* Close Button */
const ModalClose = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 32px;
  color: #12A2A9;                           /* Teal icon */
  cursor: pointer;
  background: none;
  border: none;
  transition: 0.3s ease;

  &:hover {
    color: #0b7e82;
    transform: scale(1.1);
  }
`;

/* Title */
const ModalTitle = styled.h3`
  color: #12A2A9;
  margin-bottom: 20px;
  font-size: 1.6rem;
  font-weight: 700;
`;

/* Body Text */
const ModalText = styled.p`
  margin-bottom: 15px;
  line-height: 1.6;
  color: #444;

  strong {
    color: #222;
    font-weight: 600;
  }
`;

/* MAIN MODAL COMPONENT */
const Modal = ({ isOpen, onClose, title, children }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <ModalClose onClick={onClose}>×</ModalClose>
        {title && <ModalTitle>{title}</ModalTitle>}
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};

/* TERMS MODAL (unchanged except for styling) */
export const TermsModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms and Conditions (Demo)">
      <ModalText>
        <strong>1. Disclaimer:</strong> This conTrackt Chatbot is a <strong>simulated demonstration</strong> and not for legal or business use.
      </ModalText>
      <ModalText>
        <strong>2. Data Usage:</strong> Conversation history is stored locally using <strong>localStorage</strong>.
      </ModalText>
      <ModalText>
        <strong>3. Accuracy:</strong> While simulated responses aim to be helpful, they may not be fully accurate.
      </ModalText>
      <ModalText>
        <strong>4. Intellectual Property:</strong> All logos and branding belong to Version1.
      </ModalText>
      <ModalText>
        <strong>5. Acceptance:</strong> By using this demo, you accept these terms.
      </ModalText>
    </Modal>
  );
};

export default Modal;
