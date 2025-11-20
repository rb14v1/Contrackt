import React, { useState } from 'react';
import styled from 'styled-components';
import { FaCog } from 'react-icons/fa';
// Assuming Modal is exported as default from Modal.js
import Modal from './Modal'; 

// --- Styled Components for Button and Placement ---

const ButtonContainer = styled.div`
  /* Position the button at the bottom-left corner of the parent container (Sidebar) */
  position: absolute;
  bottom: 20px; 
  left: 20px;
  z-index: 50; /* Ensure it's visible above other elements */
`;

const SettingsButton = styled.button`
  background: var(--sidebar-item-bg);
  color: var(--secondary-text);
  border: none;
  border-radius: 12px;
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 1.0rem;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);

  &:hover {
    background: var(--accent);
    color: var(--card);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px var(--shadow-color);
  }

  svg {
    font-size: 1.1rem;
  }
`;

// --- Styled Components for Modal Content ---

const ModalText = styled.p`
  margin-bottom: 15px;
  line-height: 1.6;
  font-size: 1rem;
  color: var(--text);
  
  strong {
    color: var(--accent);
    font-weight: 700;
  }
`;

const InstructionList = styled.ul`
    list-style-type: none;
    padding-left: 0;
    margin-top: 15px;
`;

const InstructionItem = styled.li`
    margin-bottom: 12px;
    padding-left: 20px;
    position: relative;
    color: var(--secondary-text);
    font-size: 0.95rem;

    &:before {
        content: '•';
        color: var(--accent);
        font-weight: bold;
        display: inline-block;
        width: 1em;
        margin-left: -1em;
    }

    strong {
        color: var(--text);
    }
`;


// --- Instructions Content Component ---

const HelpModalContent = () => (
    <div style={{backgroundColor:"white"}}>
        <ModalText>
            Welcome to the AI Assistant! Here are the basic instructions to get you started:
        </ModalText>
        <InstructionList>
            <InstructionItem>
                <strong>Start a New Chat:</strong> Click the <strong>'+ New Chat'</strong> button at the top of the sidebar to begin a fresh conversation.
            </InstructionItem>
            <InstructionItem>
                <strong>Send Messages:</strong> Type your question or request in the input field and press "Enter" or click the "Send" button.
            </InstructionItem>
            <InstructionItem>
                <strong>Chat History:</strong> All your previous conversations are saved under <strong>'Chat History'</strong>. Click on a title to resume an old chat.
            </InstructionItem>
            <InstructionItem>
                <strong>File Upload:</strong> Use the "upload icon" next to the input field to attach documents to your query.
            </InstructionItem>
        </InstructionList>
        <ModalText>
            For more advanced features, please refer to your project documentation.
        </ModalText>
    </div>
);


// --- Main Component ---

const SettingsHelpButton = () => {
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const toggleHelpModal = () => {
        setIsHelpModalOpen(!isHelpModalOpen);
    };

    return (
        <ButtonContainer>
            <SettingsButton onClick={toggleHelpModal}>
                <FaCog /> 
                Settings and Help
            </SettingsButton>
            
            <Modal 
                isOpen={isHelpModalOpen} 
                onClose={toggleHelpModal} 
            >
                <HelpModalContent />
            </Modal>
        </ButtonContainer>
    );
};

export default SettingsHelpButton;