import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
// import { useVoiceInput } from '../hooks/useVoiceInput'; // ❌ REMOVED: Voice Input Hook
import { FaPaperPlane } from 'react-icons/fa'; // ❌ Removed FaMicrophone, FaTimes
import FileUpload from './FileUpload';

// --- Styles (All styles are the same) ---
const InputAreaContainer = styled.div`
  display: flex;
  padding: 5px 8px;
  border-top: 1px solid var(--border);
  background: var(--card);
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 10px 25px;        /* Reduced height */
  padding-right: 25px;       /* ✅ MODIFIED: Reduced padding for the removed mic/controls */
  border: 2px solid black;
  border-radius: 15px;
  background: #0000;
  color: black;
  font-size: 1.1rem;
  outline: none;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;

  &:focus {
    border-color: var(--accent);
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5), 0 0 12px var(--shadow-color);
  }
`;
// ❌ REMOVED: VoiceTranscriptContainer
// ❌ REMOVED: LevelMeter
// ❌ REMOVED: LiveTranscript

const InputRightControls = styled.div`
  position: absolute;
  right: 15px;
  display: flex;
  gap: 0px;
  align-items: center;
`;
// ❌ REMOVED: ControlButton

const MainSendButton = styled.button`
  background: #21b0be;
  color: #fff;
  border: none;

  width: 82px;
  height: 38px;
  font-size: 0.9rem;

  border-radius: 8px;
  cursor: pointer;

  /* ↓ This aligns the button vertically with the search bar */
  margin-left: 12px;
  margin-top: 15px;     /* ADDED → Moves the button slightly down */

  display: flex;
  align-items: center;
  justify-content: center;

  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(33, 176, 190, 0.25);

  &:hover {
    background: #1a9dae;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(33, 176, 190, 0.35);
  }

  &:active {
    transform: scale(0.97);
  }
`;


// --- Component Logic ---

const InputArea = ({ onSendMessage, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const fileUploadRef = useRef(null);

  // ❌ REMOVED: useVoiceInput hook and all its destructured properties
  // The functionality is now solely based on text input and file upload.

  // ❌ REMOVED: useEffect for isReviewMode/transcript logic

  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim();
    const hasFiles = selectedFiles.length > 0;
    const hasText = text.length > 0;

    if (!hasFiles && !hasText) {
      // ❌ REMOVED: resetVoiceInput();
      return;
    }

    let uploadResult = null;
    if (hasFiles) {
      if (fileUploadRef.current) {
        // Assume file upload is handled by FileUpload component logic,
        // and we only call triggerUpload here.
        // NOTE: The original logic here is a bit complex, but we'll stick to it.
        uploadResult = await fileUploadRef.current.triggerUpload();
        if (uploadResult.success) {
          onSendMessage({
            text: `System: ${uploadResult.message || 'Files uploaded successfully.'}`,
            files: []
          });
          setSelectedFiles([]);
        } else {
          onSendMessage({
            text: `System: Upload Error - ${uploadResult.message || 'Failed to upload files.'}`,
            files: []
          });
          return;
        }
      }
    }

    if (hasText) {
      onSendMessage({
        text: text,
        files: []
      });
      setInputValue('');
      // ❌ REMOVED: resetVoiceInput();
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputValue, selectedFiles, onSendMessage]); // ❌ Removed resetVoiceInput dependency

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ❌ REMOVED: All voice input handlers (handleVoiceToggle, handleMicMouseDown, etc.)
  // ❌ REMOVED: useEffect for spacebar key listener

  // ❌ REMOVED: handleConfirmVoice
  // ❌ REMOVED: handleCancelVoice
  // ❌ REMOVED: useEffect for review mode automatic send

  // ✅ SIMPLIFIED: UI state flags now only depend on text input
  // const showTextInput = !isRecording; // Now always true
  // const showVoiceTranscript = isRecording; // Now always false
  // const showMainSendButton = !isRecording && !isReviewMode; // Now always true
  // const showMicButton = !isRecording && !isReviewMode; // Now always false
  // const showConfirmButton = isReviewMode; // Now always false
  // const showCancelButton = isRecording || isReviewMode; // Now always false

  const handleFilesSelected = (files) => {
    setSelectedFiles(files);
  };

  return (
    <InputAreaContainer>
      <FileUpload
        ref={fileUploadRef}
        onFilesSelected={handleFilesSelected}
        onUploadStateChange={setIsUploading}
      />

      <InputWrapper>
        <TextInput
          ref={inputRef}
          type="text"
          value={inputValue}
          // ✅✅✅ THIS IS THE FIX (kept from original) ✅✅✅
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={"Ask about a contract or start a new analysis..."} // ✅ MODIFIED: Fixed placeholder
          disabled={disabled || isUploading}
        />
        
        {/* ❌ REMOVED: VoiceTranscriptContainer */}

        {/* ❌ REMOVED: InputRightControls and all buttons inside */}
      </InputWrapper>

      <MainSendButton
        onClick={handleSendMessage}
        disabled={disabled || isUploading || (inputValue.trim() === '' && selectedFiles.length === 0)}
      >
        {isUploading ? 'Uploading...' : 'Send'}
      </MainSendButton>
    </InputAreaContainer>
  );
};

export default InputArea;