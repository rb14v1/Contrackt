import { useState, useEffect, useCallback } from 'react';

const MAX_HISTORY_LENGTH = 50; // Increased from 5 to 50 for better context
const STORAGE_KEY = 'chatbot_history';
const ACTIVE_CHATS_KEY = 'active_chats';

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState([]);
  const [isNewChat, setIsNewChat] = useState(false);
  const [pinnedChats, setPinnedChats] = useState([]);

  // Load history from storage on initial load
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY);
      const storedPinned = localStorage.getItem('pinned_chats');
      
      if (storedHistory) {
        setChatHistory(JSON.parse(storedHistory));
      }
      
      if (storedPinned) {
        setPinnedChats(JSON.parse(storedPinned));
      }
      
      // Create a new chat if there's no history
      if (!storedHistory || JSON.parse(storedHistory).length === 0) {
        createNewChat();
      } else {
        // Load the most recent chat
        const history = JSON.parse(storedHistory);
        const lastChat = history[0];
        setCurrentChatId(lastChat.id);
        setCurrentConversation(lastChat.conversation);
        setIsNewChat(false);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      createNewChat();
    }
  }, []);

  const saveToStorage = useCallback((history) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  const savePinnedChats = useCallback((pinned) => {
    try {
      localStorage.setItem('pinned_chats', JSON.stringify(pinned));
    } catch (error) {
      console.error('Error saving pinned chats:', error);
    }
  }, []);

  const createNewChat = useCallback(() => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setCurrentConversation([]);
    setIsNewChat(true);
    
    // Save active chat ID
    localStorage.setItem(ACTIVE_CHATS_KEY, newChatId);
    return newChatId;
  }, []);

  const saveCurrentChat = useCallback(() => {
    if (currentConversation.length === 0) return;

    // Create a more descriptive title from the first user message
    const userMessage = currentConversation.find(msg => msg.role === 'user');
    const title = userMessage 
      ? userMessage.content.substring(0, 40) + (userMessage.content.length > 40 ? '...' : '')
      : 'New Chat ' + new Date().toLocaleString();

    const timestamp = new Date().toISOString();
    
    const chatData = {
      id: currentChatId,
      title,
      timestamp,
      conversation: currentConversation,
      lastUpdated: Date.now()
    };

    setChatHistory(prevHistory => {
      const existingIndex = prevHistory.findIndex(chat => chat.id === currentChatId);
      let newHistory;

      if (existingIndex !== -1) {
        // Update existing chat
        newHistory = [...prevHistory];
        newHistory[existingIndex] = chatData;
      } else {
        // Add new chat to the beginning
        newHistory = [chatData, ...prevHistory];
      }

      // Limit history length but preserve pinned chats
      if (newHistory.length > MAX_HISTORY_LENGTH) {
        const pinnedIds = pinnedChats.map(chat => chat.id);
        const unpinnedHistory = newHistory.filter(chat => !pinnedIds.includes(chat.id));
        const pinnedHistory = newHistory.filter(chat => pinnedIds.includes(chat.id));
        
        // Only trim unpinned chats
        if (unpinnedHistory.length > MAX_HISTORY_LENGTH - pinnedHistory.length) {
          unpinnedHistory.splice(MAX_HISTORY_LENGTH - pinnedHistory.length);
        }
        
        newHistory = [...pinnedHistory, ...unpinnedHistory];
      }

      saveToStorage(newHistory);
      return newHistory;
    });

    setIsNewChat(false);
  }, [currentConversation, currentChatId, saveToStorage, pinnedChats]);

  const newChat = useCallback(() => {
    // Save current chat if it has messages
    if (currentConversation.length > 0) {
      saveCurrentChat();
    }
    createNewChat();
  }, [currentConversation, createNewChat, saveCurrentChat]);

  const loadConversation = useCallback((chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    // Save current chat before switching
    if (currentConversation.length > 0 && !isNewChat) {
      saveCurrentChat();
    }

    setCurrentChatId(chat.id);
    setCurrentConversation(chat.conversation);
    setIsNewChat(false);
    
    // Save active chat ID
    localStorage.setItem(ACTIVE_CHATS_KEY, chat.id);
  }, [chatHistory, currentConversation, saveCurrentChat, isNewChat]);

  const addMessage = useCallback((message) => {
    setCurrentConversation(prev => [...prev, message]);
    setIsNewChat(false);
  }, []);
  
  const pinChat = useCallback((chatId) => {
    const chatToPinIndex = chatHistory.findIndex(chat => chat.id === chatId);
    if (chatToPinIndex === -1) return;
    
    const chatToPin = chatHistory[chatToPinIndex];
    setPinnedChats(prev => {
      const newPinned = [...prev, chatToPin];
      savePinnedChats(newPinned);
      return newPinned;
    });
  }, [chatHistory, savePinnedChats]);
  
  const unpinChat = useCallback((chatId) => {
    setPinnedChats(prev => {
      const newPinned = prev.filter(chat => chat.id !== chatId);
      savePinnedChats(newPinned);
      return newPinned;
    });
  }, [savePinnedChats]);
  
  const deleteChat = useCallback((chatId) => {
    // Don't delete the current chat if it's active
    if (chatId === currentChatId && currentConversation.length > 0) {
      return;
    }
    
    setChatHistory(prev => {
      const newHistory = prev.filter(chat => chat.id !== chatId);
      saveToStorage(newHistory);
      return newHistory;
    });
    
    // Also remove from pinned if it's there
    unpinChat(chatId);
    
    // If we deleted the current chat, create a new one
    if (chatId === currentChatId) {
      createNewChat();
    }
  }, [currentChatId, currentConversation.length, createNewChat, saveToStorage, unpinChat]);

  return {
    chatHistory,
    currentChatId,
    currentConversation,
    setCurrentConversation,
    isNewChat,
    pinnedChats,
    newChat,
    loadConversation,
    addMessage,
    pinChat,
    unpinChat,
    deleteChat,
    saveCurrentChat
  };
};