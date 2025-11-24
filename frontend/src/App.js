import React, { useState, useEffect } from 'react';

import styled from 'styled-components';

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import WelcomePage from './components/WelcomePage';

import ChatbotPage from './components/ChatbotPage';

import AllCategoriesPage from './components/AllCategoriesPage';

import NotificationPage from './components/NotificationPage';  // ✅ Import

import ReminderPage from './components/ReminderPage';  // ✅ Import

import { GlobalStyle } from './styles/GlobalStyles';
 
const API_URL = 'http:18.212.212.53';
 
const AppContainer = styled.div`

  height: 100vh;

  overflow: hidden;

`;
 
// Wrapper component to handle routing with navigation functions

function AppContent() {

  const navigate = useNavigate();
 
  // ✅ State for alerts and reminders

  const [alerts, setAlerts] = useState([]);

  const [reminders, setReminders] = useState([]);
 
  // ✅ State for modal visibility

  const [showNotifications, setShowNotifications] = useState(false);

  const [showReminders, setShowReminders] = useState(false);
 
  // ✅ Fetch alerts and reminders on mount

  useEffect(() => {

    const fetchAlertsAndReminders = async () => {

      try {

        console.log('🔄 Fetching alerts and reminders...');
 
        const response = await fetch(`${API_URL}/alerts-reminders/`);
 
        if (!response.ok) {

          throw new Error(`HTTP error! status: ${response.status}`);

        }
 
        const data = await response.json();
 
        console.log('✅ Alerts fetched:', data.alerts);

        console.log('✅ Reminders fetched:', data.reminders);
 
        setAlerts(data.alerts || []);

        setReminders(data.reminders || []);
 
      } catch (error) {

        console.error("❌ Error fetching alerts and reminders:", error);

        // Don't clear existing data on error

      }

    };
 
    // Fetch immediately

    fetchAlertsAndReminders();
 
    // Refresh every 5 minutes (300000 ms)

    const interval = setInterval(fetchAlertsAndReminders, 300000);
 
    return () => clearInterval(interval);

  }, []);
 
  const handleStartChat = () => {

    console.log('🚀 Navigating to chatbot');

    navigate('/chat');

  };
 
  const handleViewAllPDFs = () => {

    console.log('📄 Navigating to categories');

    navigate('/categories');

  };
 
  const handleBackToWelcome = () => {

    console.log('🏠 Navigating to welcome page');

    navigate('/');

  };
 
  return (
<AppContainer>
<GlobalStyle />
<Routes>
<Route

          path="/"

          element={
<WelcomePage

              onStartChat={handleStartChat}

              onViewAllPDFs={handleViewAllPDFs}

              alerts={alerts}  // ✅ Pass alerts

              reminders={reminders}  // ✅ Pass reminders

              alertsCount={alerts.length}  // ✅ Pass count

              remindersCount={reminders.length}  // ✅ Pass count

            />

          }

        />
<Route

          path="/chat"

          element={<ChatbotPage onNavigateHome={handleBackToWelcome} />}

        />
<Route

          path="/categories"

          element={
<AllCategoriesPage 

              onBack={handleBackToWelcome}

              alerts={alerts}  // ✅ Pass alerts

              reminders={reminders}  // ✅ Pass reminders

              onShowNotifications={() => setShowNotifications(true)}  // ✅ Pass handler

              onShowReminders={() => setShowReminders(true)}  // ✅ Pass handler

            />

          }

        />
</Routes>
 
      {/* ✅ Render modals on top of everything */}

      {showNotifications && (
<NotificationPage

          onClose={() => setShowNotifications(false)}

          alerts={alerts}

        />

      )}

      {showReminders && (
<ReminderPage

          onClose={() => setShowReminders(false)}

          reminders={reminders}

        />

      )}
</AppContainer>

  );

}
 
function App() {

  return (
<Router>
<AppContent />
</Router>

  );

}
 
export default App;

 