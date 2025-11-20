import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { FaUser, FaRobot, FaCopy, FaCheck, FaExternalLinkAlt, FaUpload, FaFilePdf } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
 
// WHITE + NEUTRAL COLOR SCHEME
const ChatContainer = styled.div`
  flex: 1;
  padding: 32px 48px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
  background: #fff;
  color: #212121;
 
  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background: #f8f8f8;
  }
  &::-webkit-scrollbar-thumb {
    background: #21b0be;
    border-radius: 10px;
  }
 
  @media (max-width: 768px) {
    padding: 18px;
    gap: 18px;
  }
`;
 
const pulse = keyframes`
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.5; }
`;
 
const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 22px;
  background: #f8f8f8;
  color: #212121;
  border-radius: 25px;
  border-bottom-left-radius: 10px;
  max-width: 70%;
  align-self: flex-start;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
 
  .typing-dots {
    display: flex;
    gap: 4px;
  }
  .dot {
    width: 6px;
    height: 6px;
    background: #21b0be;
    border-radius: 50%;
    animation: ${pulse} 1.4s infinite;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;
 
const MessageContainer = styled.div`
  max-width: 70%;
  display: flex;
  flex-direction: column;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  position: relative;
  &:hover .message-actions {
    opacity: 1;
  }
`;
 
const Message = styled.div`
  width: 100%;
  padding: 16px 22px;
  border-radius: 22px;
  font-size: 1.06rem;
  line-height: 1.68;
  word-wrap: break-word;
  display: inline-block;
  box-shadow: 0 1px 4px rgba(33,176,190,0.11);
  position: relative;
  transition: box-shadow 0.2s;
 
  &.bot-message {
    background: #f8f8f8;
    color: #212121;
    border-bottom-left-radius: 10px;
    border-left: 3px solid #21b0be;
    &.streaming::after {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: #21b0be;
      border-radius: 50%;
      margin-left: 5px;
      animation: ${pulse} 1.5s infinite;
    }
  }
 
  &.user-message {
    background: #e2e2e2;
    color: #212121;
    border-bottom-right-radius: 10px;
    border-right: 3px solid #21b0be;
    text-align: left;
    font-weight: 600;
    box-shadow: 0 3px 9px #f4f4f4;
  }
 
  &:hover {
    box-shadow: 0 4px 12px rgba(33,176,190,0.12);
  }
`;
 
const MessageActions = styled.div`
  position: absolute;
  top: 8px;
  right: ${props => props.isUser ? 'auto' : '8px'};
  left: ${props => props.isUser ? '8px' : 'auto'};
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2;
`;
 
const ActionButton = styled.button`
  background: rgba(33,176,190,0.06);
  color: #21b0be;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(33,176,190,0.10);
    background: rgba(33,176,190,0.14);
  }
`;
 
const Timestamp = styled.div`
  font-size: 0.78rem;
  color: #757575;
  margin-top: 4px;
  padding: 0 8px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
  opacity: 0.98;
`;
 
const WelcomeMessage = styled(Message)`
  align-self: flex-start;
  background: #f8f8f8;
  color: #212121;
  border-bottom-left-radius: 10px;
  margin-top: 20px;
`;

// NEW: Action buttons container
const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
  margin: 20px 0;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 12px;
  max-width: 70%;
  align-self: flex-start;
`;

// NEW: Styled action button
const StyledActionButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #21b0be 0%, #26dfe9 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(33, 176, 190, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(33, 176, 190, 0.5);
  }
  
  &:active {
    transform: translateY(0);
  }
`;
 
const MultiAnswerContainer = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;
 
const AnswerItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;
 
const NumberTag = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #21b0be;
  background: #e2e2e2;
  padding: 3px 8px;
  border-radius: 6px;
  min-width: 32px;
  text-align: center;
`;
 
const AnswerCard = styled.div`
  flex: 1;
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(33,176,190,0.06);
`;
 
const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;
 
const DocLink = styled.a`
  color: #21b0be;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.97rem;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    color: #159da9;
    text-decoration: underline;
  }
`;
 
const CardAnswer = styled.p`
  font-size: 0.92rem;
  color: #212121;
  line-height: 1.53;
  margin-bottom: 0;
  white-space: pre-wrap;
`;

// NEW: PDF selection display
const SelectedPDFsContainer = styled.div`
  margin-top: 15px;
  padding: 15px;
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
`;

const PDFListTitle = styled.h4`
  color: #21b0be;
  font-size: 1rem;
  margin: 0 0 10px 0;
`;

const PDFItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PDFIcon = styled(FaFilePdf)`
  color: #21b0be;
  font-size: 1.2rem;
`;

const PDFName = styled.span`
  flex: 1;
  color: #212121;
  font-size: 0.9rem;
`;

const PDFViewLink = styled.a`
  color: #21b0be;
  text-decoration: none;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    color: #159da9;
    text-decoration: underline;
  }
`;

// NEW: Summarize button
const SummarizeButton = styled.button`
  background: linear-gradient(135deg, #21b0be 0%, #26dfe9 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 15px;
  box-shadow: 0 4px 15px rgba(33, 176, 190, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(33, 176, 190, 0.5);
  }
  
  &:active {
    transform: translateY(0);
  }
`;
 
const ChatArea = ({ 
  messages, 
  isNewChat, 
  isTyping,
  onUploadClick,
  onSelectPDFClick 
}) => {
  const chatEndRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
 
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
 
  const handleCopyMessage = (content, index) => {
    if (typeof content === 'string') {
      navigator.clipboard.writeText(content);
    } else {
      const summary = content.results.map((r, i) => `${i + 1}. ${r.source_name}: ${r.answer}`).join('\n\n');
      navigator.clipboard.writeText(summary);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
 
  // Helper function to extract document name from S3 URL and remove the UUID prefix
  const getDocNameFromS3Url = (s3Url) => {
    if (typeof s3Url === 'string') {
      // 1. Get the filename (text after the last '/')
      const filenameWithUUID = s3Url.substring(s3Url.lastIndexOf('/') + 1);

      // 2. Regex to match the standard UUID prefix followed by a hyphen
      // (8-4-4-4-12 format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
      
      const match = filenameWithUUID.match(uuidRegex);
      
      if (match) {
        // If a UUID prefix is found, return the substring after it
        return filenameWithUUID.substring(match[0].length);
      }
      
      // If no UUID prefix is found, return the original filename (e.g., if it's already clean)
      return filenameWithUUID;
    }
    // Return original if not a string
    return s3Url;
  };
 
  const renderMessageContent = (msg) => {
    // NEW: Handle PDF selection type
    if (msg.type === 'pdf_selection' && msg.pdfs) {
      return (
        <>
          <ReactMarkdown>{msg.content}</ReactMarkdown>
          <SelectedPDFsContainer>
            <PDFListTitle>Selected Documents:</PDFListTitle>
            {msg.pdfs.map((pdf, index) => (
              <PDFItem key={pdf.s3_url || index}>
                <PDFIcon />
                <PDFName>{pdf.name || pdf.title || 'Unnamed Document'}</PDFName>
                <PDFViewLink href={pdf.viewable_url} target="_blank" rel="noopener noreferrer">
                  View <FaExternalLinkAlt size={10} />
                </PDFViewLink>
              </PDFItem>
            ))}
            {msg.pdfs && msg.pdfs.length > 0 && msg.onSummarize && (
              <SummarizeButton onClick={() => msg.onSummarize(msg.pdfs)}>
                📝 Summarise on all {msg.pdfs.length} document{msg.pdfs.length > 1 ? 's' : ''}
              </SummarizeButton>
            )}
          </SelectedPDFsContainer>
        </>
      );
    }

    if (msg.type === 'multi_answer' && msg.results) {
      return (
        <>
          <ReactMarkdown>{msg.content}</ReactMarkdown>
          <MultiAnswerContainer>
            {msg.results.map((item, index) => (
              <AnswerItem key={item.id || index}>
                <NumberTag>{index + 1}</NumberTag>
                <AnswerCard>
                  <CardHeader>
                    {/* MODIFICATION HERE: Use getDocNameFromS3Url to display the clean filename */}
                    <DocLink href={item.viewable_url} target="_blank" rel="noopener noreferrer">
                      {getDocNameFromS3Url(item.source_name)} <FaExternalLinkAlt size={12} />
                    </DocLink>
                  </CardHeader>
                  <CardAnswer>{item.answer}</CardAnswer>
                </AnswerCard>
              </AnswerItem>
            ))}
          </MultiAnswerContainer>
        </>
      );
    }
    return <ReactMarkdown>{msg.content}</ReactMarkdown>;
  };
 
  return (
    <ChatContainer>
      {messages.length === 0 && isNewChat && (
        <>
          <MessageContainer>
            <WelcomeMessage>
              New chat started! How can I help you with your contracts? 
            </WelcomeMessage>
            <Timestamp>{formatDistanceToNow(new Date(), { addSuffix: true })}</Timestamp>
          </MessageContainer>
          
          {/* NEW: Action buttons for new chat */}
          <ActionButtonsContainer>
            
            <StyledActionButton onClick={onSelectPDFClick}>
              <FaFilePdf /> Select PDF
            </StyledActionButton>
          </ActionButtonsContainer>
        </>
      )}
 
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const timestamp = message.timestamp || new Date();
        const isSimpleText = typeof message.content === 'string';
        return (
          <MessageContainer key={index} isUser={isUser}>
            <Message
              className={`${isUser ? 'user-message' : 'bot-message'} ${message.isStreaming ? 'streaming' : ''}`}
            >
              {renderMessageContent(message)}
            </Message>
            <MessageActions className="message-actions" isUser={isUser}>
              {!isUser && (
                <ActionButton
                  onClick={() =>
                    handleCopyMessage(isSimpleText ? message.content : message, index)
                  }
                  title="Copy message"
                >
                  {copiedIndex === index ? <FaCheck /> : <FaCopy />}
                </ActionButton>
              )}
            </MessageActions>
            <Timestamp isUser={isUser}>
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </Timestamp>
          </MessageContainer>
        );
      })}
 
      {isTyping && (
        <MessageContainer>
          <TypingIndicator>
            <FaRobot />
            <div className="typing-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </TypingIndicator>
        </MessageContainer>
      )}
      <div ref={chatEndRef} />
    </ChatContainer>
  );
};
 
export default ChatArea;