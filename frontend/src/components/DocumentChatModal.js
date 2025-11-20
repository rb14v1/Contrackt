import React from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import InputArea from './InputArea'; // Re-using your component
import ReactMarkdown from 'react-markdown';

// --- Styles for the Modal ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card);
`;

const ModalTitle = styled.h3`
  color: var(--text);
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  
  &:hover {
    color: var(--accent);
  }
`;

// --- Styles for the chat area inside the modal ---
const ModalChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => (props.$role === 'user' ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.div`
  background: ${props => (props.$role === 'user' ? 'var(--accent)' : 'var(--card)')};
  color: ${props => (props.$role === 'user' ? '#fff' : 'var(--text)')};
  padding: 10px 15px;
  border-radius: 15px;
  max-width: 80%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  word-wrap: break-word;
  line-height: 1.5;
`;

// --- The Component ---
const DocumentChatModal = ({
  isOpen,
  onClose,
  docName,
  chatHistory,
  isProcessing,
  onSendMessage,
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle title={docName}>
            Chat with: {docName || 'Document'}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalChatArea>
          {chatHistory.map((msg, index) => (
            <MessageWrapper key={index} $role={msg.role}>
              <MessageBubble $role={msg.role}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </MessageBubble>
            </MessageWrapper>
          ))}
          {isProcessing && (
            <MessageWrapper $role="assistant">
              <MessageBubble $role="assistant">
                ...
              </MessageBubble>
            </MessageWrapper>
          )}
        </ModalChatArea>

        <InputArea
          onSendMessage={onSendMessage}
          isProcessing={isProcessing}
        />
      </ModalContainer>
    </ModalOverlay>
  );
};

export default DocumentChatModal;
