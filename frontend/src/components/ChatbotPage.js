import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputArea from './InputArea';
import NotificationButton from './NotificationButton';
import NotificationPage from './NotificationPage';
import DocumentListPage from './DocumentListPage';
import ReminderButton from './ReminderButton';
import ReminderPage from './ReminderPage';
import DocumentChatModal from './DocumentChatModal';
import ContractSelectionModal from './ContractSelectionModal';
import { TermsModal } from './Modal';
import { useChatHistory } from '../hooks/useChatHistory';
// import { useTTS } from '../hooks/useTTS'; // ❌ REMOVED: TTS Hook
import { FaBars, FaEdit, FaBell } from 'react-icons/fa';

const CONTRACT_CATEGORIES = [
  { key: "all", label: "All Contracts" },
  { key: "nda", label: "NDA" },
  { key: "employment_agreements", label: "Employment Agreements" },
  { key: "loan_agreements", label: "Loan Agreements" },
];

const ChatbotContainer = styled.div`
  height: 100vh;
  display: flex;
  position: relative;
  background: #f5f5f5;
  color: var(--text);
`;

const SidebarWrapper = styled.div`
  width: 300px;
  flex-shrink: 0;
  height: 100vh;
  transition: transform 0.3s ease-in-out;
  overflow: hidden;
  z-index: 20;
`;

const MainArea = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 25px;
  background: linear-gradient(90deg, #ffffff 65%, #21b0be 100%);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 4px 15px rgba(33,176,190,0.10);
`;

const HeaderTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent);
  text-shadow: 0 0 8px rgba(33,176,190,0.08);
  display: flex;
  align-items: center;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const CategorySelector = styled.select`
  background: white;
  color: black;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover, &:focus {
    border-color: var(--accent);
  }
`;

const MiniSidebar = styled.div`
  width: 60px;
  height: 100vh;
  background: #f8f8f8;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  flex-shrink: 0;
  z-index: 10;
`;

const MiniSidebarGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  align-items: center;
`;

const MiniSidebarButton = styled.button`
  background: none;
  border: none;
  color: var(--secondary-text);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  &:hover {
    background: var(--sidebar-item-hover);
    color: var(--accent);
  }
`;

// Footer styled component
const Footer = styled.footer`
  width: 100%;
  padding: 6px 15px;         /* Reduced height */
  background: linear-gradient(90deg, #ffffff 55%, #21b0be 100%);
  border-top: 1px solid var(--border);
  text-align: center;
  color: var(--secondary-text);
  font-size: 0.75rem;         /* Smaller text */
  font-weight: 500;
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.04);  /* Softer shadow */
  z-index: 10;
`;


const API_URL = 'http://127.0.0.1:8000';

const ChatbotPage = ({ onNavigateHome }) => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDocListOpen, setIsDocListOpen] = useState(false);
  const [docListTitle, setDocListTitle] = useState('');
  const [docList, setDocList] = useState([]);
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [remindersList, setRemindersList] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [modalChatHistory, setModalChatHistory] = useState([]);
  const [currentModalDoc, setCurrentModalDoc] = useState(null);
  const [isModalProcessing, setIsModalProcessing] = useState(false);

  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedPDFsToDisplay, setSelectedPDFsToDisplay] = useState([]);
  const [selectedDocumentsForSearch, setSelectedDocumentsForSearch] = useState([]);
  const [isSearchScoped, setIsSearchScoped] = useState(false);

  const isInitialMount = useRef(true);

  const {
    chatHistory,
    currentChatId,
    currentConversation,
    setCurrentConversation,
    addMessage,
    pinnedChats,
    newChat,
    loadConversation,
    pinChat,
    unpinChat,
    deleteChat,
    saveCurrentChat
  } = useChatHistory();

  // ❌ REMOVED: TTS Hook (kept dummy functions as in original file)
  const speak = () => { };
  const stopSpeaking = () => { };
  const isSpeaking = false;

  useEffect(() => {
    if (isInitialMount.current) {
      console.log('🆕 Starting fresh chat from homepage');
      newChat();
      isInitialMount.current = false;
    }
  }, [newChat]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const fetchAlertsAndReminders = async () => {
      try {
        const response = await fetch(`${API_URL}/alerts-reminders/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAlerts(data.alerts || []);
        setRemindersList(data.reminders || []);
      } catch (error) {
        console.error("Error fetching alerts and reminders:", error);
      }
    };
    fetchAlertsAndReminders();
    const interval = setInterval(fetchAlertsAndReminders, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChatModal = useCallback((doc) => {
    setCurrentModalDoc(doc);
    setModalChatHistory([]);
    setIsChatModalOpen(true);
    // ❌ REMOVED: stopSpeaking();
  }, []);

  const handleCloseChatModal = useCallback(() => {
    setIsChatModalOpen(false);
    setCurrentModalDoc(null);
    setModalChatHistory([]);
  }, []);

  const handleSendModalMessage = useCallback(async (messageData) => {
    const message = typeof messageData === 'string' ? messageData : messageData.text;
    if (!message.trim() || !currentModalDoc) return;

    setIsModalProcessing(true);

    const userMessage = { role: 'user', content: message };
    setModalChatHistory(prev => [...prev, userMessage]);

    const botMessageId = Date.now().toString();
    const botMessage = { role: 'assistant', content: '...', id: botMessageId };
    setModalChatHistory(prev => [...prev, botMessage]);

    try {
      const response = await fetch(`${API_URL}/chat-with-document/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: message,
          s3_url: currentModalDoc.s3_url,
        }),
      });

      if (!response.ok) throw new Error(`Backend Error: ${response.status}`);
      const data = await response.json();
      const answer = data.answer || "Sorry, I had trouble with that question.";

      setModalChatHistory(prev =>
        prev.map(msg =>
          msg.id === botMessageId ? { ...msg, content: answer } : msg
        )
      );
    } catch (err) {
      setModalChatHistory(prev =>
        prev.map(msg =>
          msg.id === botMessageId ? { ...msg, content: "⚠️ Failed to get answer." } : msg
        )
      );
    } finally {
      setIsModalProcessing(false);
    }
  }, [currentModalDoc]);

  const handleSummarizeSelected = useCallback(async (selectedPdfs) => {
    if (!selectedPdfs || selectedPdfs.length === 0) return;

    // ❌ REMOVED: stopSpeaking();
    setIsProcessing(true);
    setIsTyping(true);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Summarize these ${selectedPdfs.length} documents`,
      timestamp: new Date().toISOString()
    };
    addMessage(userMessage);

    const botMessageId = Date.now().toString() + '-bot';
    const botMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '...',
      timestamp: new Date().toISOString()
    };
    addMessage(botMessage);

    try {
      const s3Urls = selectedPdfs.map(pdf => pdf.s3_url);

      const response = await fetch(`${API_URL}/summarize-multiple/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          s3_urls: s3Urls,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Error Response:", errorText);
        throw new Error(`Backend Error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.summary || data.answer || "Summary completed.";

      setCurrentConversation(prev => {
        const idx = prev.findIndex(msg => msg.id === botMessageId);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], content: summary };
          return copy;
        }
        return prev;
      });

      // ❌ REMOVED: speak(summary);

    } catch (err) {
      console.error("Error:", err);
      setCurrentConversation(prev => {
        const idx = prev.findIndex(msg => msg.id === botMessageId);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], content: "⚠️ Failed to summarize documents." };
          return copy;
        }
        return prev;
      });
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
    }
  }, [addMessage, setCurrentConversation]);

  const handleSendMessage = useCallback(async (messageData) => {
    const message = typeof messageData === 'string' ? messageData : messageData.text;
    if (!message.trim()) return;

    // ❌ REMOVED: stopSpeaking();
    setIsProcessing(true);
    setIsTyping(true);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    addMessage(userMessage);

    const botMessageId = Date.now().toString() + '-bot';
    const botMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '...',
      timestamp: new Date().toISOString()
    };
    addMessage(botMessage);

    try {
      const payload = { query: message };

      if (isSearchScoped && selectedDocumentsForSearch.length > 0) {
        payload.scoped_search = true;
        payload.s3_urls = selectedDocumentsForSearch.map(doc => doc.s3_url);
      } else if (selectedCategory !== 'all') {
        payload.category = selectedCategory;
      }

      const response = await fetch(`${API_URL}/answer/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Backend Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && Array.isArray(data.results)) {
        setCurrentConversation(prev => {
          const idx = prev.findIndex(msg => msg.id === botMessageId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = {
              ...copy[idx],
              content: `I found ${data.results.length} relevant document(s) for your query:`,
              type: 'multi_answer',
              results: data.results,
            };
            return copy;
          }
          return prev;
        });
        // ❌ REMOVED: stopSpeaking();
      } else if (data.answer) {
        setCurrentConversation(prev => {
          const idx = prev.findIndex(msg => msg.id === botMessageId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], content: data.answer };
            return copy;
          }
          return prev;
        });
        // ❌ REMOVED: speak(data.answer);
      } else {
        throw new Error("Invalid response format from backend.");
      }
    } catch (err) {
      setCurrentConversation(prev => {
        const idx = prev.findIndex(msg => msg.id === botMessageId);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], content: "⚠️ Failed to fetch response from backend." };
          return copy;
        }
        return prev;
      });
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
    }
  }, [addMessage, setCurrentConversation, selectedCategory, isSearchScoped, selectedDocumentsForSearch]);

  const handleUploadFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        await handleFileUpload(file);
      }
    };
    input.click();
  }, []);

  const handleFileUpload = async (file) => {
    const category = prompt(
      'Enter contract category:\n\n1. nda\n2. employee_contract\n3. loan_agreement',
      'nda'
    );

    if (!category) {
      alert('Upload cancelled - no category selected');
      return;
    }

    const validCategories = ['nda', 'employee_contract', 'loan_agreement'];
    if (!validCategories.includes(category)) {
      alert('Invalid category! Please use: nda, employee_contract, or loan_agreement');
      return;
    }

    const formData = new FormData();
    formData.append('contract_file', file);
    formData.append('contract_category', category);

    try {
      setIsProcessing(true);

      const response = await fetch(`${API_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      const uploadMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Successfully uploaded: **${file.name}**\n\nCategory: ${category}\nQdrant ID: ${data.qdrant_id}`,
        timestamp: new Date().toISOString()
      };
      addMessage(uploadMessage);

    } catch (error) {
      console.error('Upload error:', error);

      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Upload failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      addMessage(errorMessage);

    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPDF = useCallback(() => {
    setIsSelectionModalOpen(true);
  }, []);

  const handleConfirmSelection = useCallback((selected) => {
    setSelectedPDFsToDisplay(selected);
    setSelectedDocumentsForSearch(selected);
    setIsSearchScoped(true);

    if (selected.length > 0) {
      const selectionMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `You selected ${selected.length} PDF(s). Your searches will now be limited to these documents only.`,
        type: 'pdf_selection',
        pdfs: selected,
        onSummarize: handleSummarizeSelected,
        timestamp: new Date().toISOString()
      };
      addMessage(selectionMessage);
    }
  }, [addMessage, handleSummarizeSelected]);

  const handleClearSelectedDocuments = useCallback(() => {
    setSelectedDocumentsForSearch([]);
    setIsSearchScoped(false);

    const clearMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '✅ Document selection cleared. You can now search all documents again.',
      timestamp: new Date().toISOString()
    };
    addMessage(clearMessage);
  }, [addMessage]);

  const handleNewChat = useCallback(() => {
    // ❌ REMOVED: stopSpeaking();
    newChat();
  }, [newChat]);

  const handleLoadChat = useCallback((chatId) => {
    // ❌ REMOVED: stopSpeaking();
    loadConversation(chatId);
  }, [loadConversation]);

  const handleSelectCategory = useCallback(async (categoryKey, label) => {
    // ❌ REMOVED: stopSpeaking();

    if (categoryKey === 'reminder') {
      setShowReminders(true);
      return;
    }

    setDocListTitle(label);
    setIsDocListOpen(true);
    setIsFetchingDocs(true);
    setDocList([]);

    try {
      const response = await fetch(`${API_URL}/contracts/${categoryKey}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Backend Error: ${response.status}`);
      }

      const data = await response.json();
      setDocList(data.results || []);
    } catch (err) {
      setDocList([]);
    } finally {
      setIsFetchingDocs(false);
    }
  }, []);

  const handleShowSettings = useCallback(() => {
    setIsTermsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsTermsModalOpen(false);
  }, []);

  useEffect(() => {
    if (currentConversation.length > 0) {
      const timeoutId = setTimeout(() => {
        saveCurrentChat();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [currentConversation, saveCurrentChat]);

  useEffect(() => {
    // ❌ REMOVED: TTS cleanup
    return () => {
      // stopSpeaking();
    };
  }, []); // ❌ REMOVED: [stopSpeaking] dependency

  return (
    <>
      <ChatbotContainer>
        {isSidebarOpen && (
          <SidebarWrapper $isopen={isSidebarOpen}>
            <Sidebar
              onToggleSidebar={toggleSidebar}
              chatHistory={chatHistory}
              currentChatId={currentChatId}
              pinnedChats={pinnedChats}
              onNewChat={handleNewChat}
              onSelectChat={handleLoadChat}
              onPinChat={pinChat}
              onUnpinChat={unpinChat}
              onDeleteChat={deleteChat}
              onSelectCategory={handleSelectCategory}
              onNavigateHome={onNavigateHome}
            />
          </SidebarWrapper>
        )}

        {!isSidebarOpen && (
          <MiniSidebar>
            <MiniSidebarGroup>
              <MiniSidebarButton onClick={toggleSidebar}>
                <FaBars />
              </MiniSidebarButton>
              <MiniSidebarButton onClick={handleNewChat}>
                <FaEdit />
              </MiniSidebarButton>
            </MiniSidebarGroup>
            <MiniSidebarGroup>
              <MiniSidebarButton onClick={handleShowSettings} />
            </MiniSidebarGroup>
          </MiniSidebar>
        )}

        <MainArea>
          <Header>
            <HeaderTitle>
              <div
                style={{
                  fontSize: '32px',
                  color: 'black',
                  cursor: 'pointer',
                }}
                onClick={onNavigateHome}
              >
                <i className="bi bi-house"></i>
              </div>
            </HeaderTitle>

            {isSearchScoped && selectedDocumentsForSearch.length > 0 && (
              <div style={{
                background: 'rgba(33, 176, 190, 0.2)',
                border: '1px solid #21b0be',
                borderRadius: '8px',
                padding: '8px 15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.85rem',
                color: '#21b0be'
              }}>
                🔍 Searching in {selectedDocumentsForSearch.length} selected documents
                <button
                  onClick={handleClearSelectedDocuments}
                  style={{
                    background: 'transparent',
                    border: '1px solid #21b0be',
                    color: '#21b0be',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            <HeaderActions>
              <CategorySelector
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">
                  Select Category
                </option>
                {CONTRACT_CATEGORIES.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </CategorySelector>

              <NotificationButton
                onNotificationClick={() => setShowNotifications(true)}
                notificationCount={alerts.length}
              />

              {/* FIX: Replaced the custom button with the imported ReminderButton component */}
              <ReminderButton
                onReminderClick={() => setShowReminders(true)}
                reminderCount={remindersList.length}


              />

            </HeaderActions>
          </Header>

          <ChatArea
            messages={currentConversation}
            isTyping={isTyping}
            // ❌ REMOVED: TTS Props
            // onSpeakMessage={speak} 
            // isSpeaking={isSpeaking}
            // onStopSpeaking={stopSpeaking}
            onOpenChatModal={handleOpenChatModal}
            isNewChat={currentConversation.length === 0}

            onSelectPDFClick={handleSelectPDF}
          />

          <InputArea
            onSendMessage={handleSendMessage}
          // ❌ REMOVED: isProcessing={isProcessing}
          />

          {/* Footer */}
          <Footer>
            ContractChat AI: Always verify critical information with original documents.
          </Footer>

        </MainArea>

        <TermsModal isOpen={isTermsModalOpen} onClose={handleCloseModal} />

        {showNotifications && (
          <NotificationPage
            onClose={() => setShowNotifications(false)}
            alerts={alerts}
          />
        )}

        <DocumentListPage
          isOpen={isDocListOpen}
          onClose={() => setIsDocListOpen(false)}
          title={docListTitle}
          documents={docList}
          isLoading={isFetchingDocs}
        />

        {showReminders && (
          <ReminderPage
            onClose={() => setShowReminders(false)}
            reminders={remindersList}
          />
        )}

        <DocumentChatModal
          isOpen={isChatModalOpen}
          onClose={handleCloseChatModal}
          docName={currentModalDoc?.source_name}
          chatHistory={modalChatHistory}
          isProcessing={isModalProcessing}
          onSendMessage={handleSendModalMessage}
        />

        <ContractSelectionModal
          isOpen={isSelectionModalOpen}
          onClose={() => setIsSelectionModalOpen(false)}
          onConfirm={handleConfirmSelection}
        />

      </ChatbotContainer>
    </>
  );
};

export default ChatbotPage;