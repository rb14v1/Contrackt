import { useState, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [hasFinalResult, setHasFinalResult] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Sync recording state with listening flag from the library
  useEffect(() => {
    setIsRecording(listening);
  }, [listening]);

  // Start voice recognition
  const startRecording = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      alert('Your browser does not support speech recognition. Please try Chrome or Edge.');
      return;
    }

    resetTranscript();
    setIsReviewMode(false);
    setHasFinalResult(false);
    SpeechRecognition.startListening({ continuous: true });

    // Lightweight input level simulation for visual feedback
    const interval = setInterval(() => {
      if (listening) {
        setInputLevel(Math.random() * 0.5 + 0.1);
      } else {
        setInputLevel(0);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [browserSupportsSpeechRecognition, listening, resetTranscript]);

  // Stop recording and enter review mode
  const stopRecording = useCallback(() => {
    SpeechRecognition.stopListening();
    setIsReviewMode(true);
    setHasFinalResult(true);
    setInputLevel(0);
  }, []);

  // Reset all voice input state
  const resetVoiceInput = useCallback(() => {
    resetTranscript();
    setIsRecording(false);
    setIsReviewMode(false);
    setHasFinalResult(false);
    setInputLevel(0);
  }, [resetTranscript]);

  // Cancel recording and clear transcript
  const cancelRecording = useCallback(() => {
    SpeechRecognition.stopListening();
    resetTranscript();
    setIsRecording(false);
    setIsReviewMode(false);
    setHasFinalResult(false);
    setInputLevel(0);
  }, [resetTranscript]);

  // Confirm transcript and exit review mode
  const confirmTranscript = useCallback(() => {
    setIsReviewMode(false);
    setIsRecording(false);
    return transcript;
  }, [transcript]);

  return {
    isRecording,
    transcript,
    isReviewMode,
    hasFinalResult,
    inputLevel,
    startRecording,
    stopRecording,
    resetVoiceInput,
    cancelRecording,
    confirmTranscript,
    finalTranscript: transcript,
    browserSupportsSpeechRecognition,
  };
};