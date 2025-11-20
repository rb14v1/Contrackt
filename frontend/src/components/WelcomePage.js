import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBell } from 'react-icons/fa';
import SettingsHelpButton from './SettingsHelpButton';
import NotificationButton from './NotificationButton';
import ReminderButton from './ReminderButton';
import ReminderPage from './ReminderPage';
import NotificationPage from './NotificationPage';

const COLOR = {
  background: '#F5F5F5',
  chatBubble: '#FFFFFF',
  inputBg: '#FAFAFA',
  inputBorder: '#E0E0E0',
  accentPurple: '#7E57C2',
  deepPurple: '#5E35B1',
  teal: '#21b0be',
  tealDark: '#159da9',
  primaryText: '#212121',
  secondaryText: '#757575',
  placeholderText: '#BDBDBD',
};

const WelcomeContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  background: ${COLOR.background};
  overflow: hidden;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 20px; /* reduced */
  align-items: center;
`;

const LeftLogos = styled.div`
  display: flex;
  align-items: center;
  gap: 10px; /* reduced */
`;

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoImage = styled.img`
  height: 50px; /* reduced size */
  width: auto;
  object-fit: contain;
  background: none;
  border: none;
  box-shadow: none;
`;

const WelcomeContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  z-index: 1;
  text-align: center;
  padding: 0 10px;
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem; /* reduced */
  font-weight: 700;
  margin-bottom: 32px;
  color: ${COLOR.teal};
  text-shadow: 0 0 10px rgba(33,176,190,0.18);
`;

const TypingTagline = styled.div`
  font-size: 1.2rem; /* reduced */
  color: ${COLOR.secondaryText};
  font-family: 'Fira Mono', 'Consolas', 'Menlo', 'monospace';
  min-height: 24px;
  margin-bottom: 20px;
  white-space: pre;
  letter-spacing: 0.02em;
  border-right: 2px solid ${COLOR.accentPurple};
  width: fit-content;
  animation: blink 2s steps(3) infinite;

  @keyframes blink {
    0%, 100% { border-color: ${COLOR.accentPurple}; }
    50% { border-color: transparent; }
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 20px; /* reduced */
  margin-top: 20px;
`;

const StartButton = styled.button`
  background: ${COLOR.teal};
  color: #FFFFFF;
  border: none;
  padding: 12px 26px; /* reduced */
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 4px 14px ${COLOR.teal}40;
  transition: all 0.3s ease;
  &:hover {
    background: ${COLOR.tealDark};
    transform: translateY(-2px);
    box-shadow: 0 8px 18px ${COLOR.teal}60;
  }
  &:active {
    transform: translateY(-1px);
  }
`;

const PdfButton = styled(StartButton)`
  background: ${COLOR.teal};
  color: #FFFFFF;
  &:hover {
    background: ${COLOR.tealDark};
  }
`;

const Footer = styled.footer`
  width: 100%;
  padding: 10px 20px; /* reduced */
  background: ${COLOR.chatBubble};
  border-top: 1px solid ${COLOR.inputBorder};
  text-align: center;
  color: ${COLOR.secondaryText};
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.04);
  z-index: 10;
`;

const WelcomePage = ({
  onStartChat,
  onViewAllPDFs,
  alerts = [],
  reminders = [],
  alertsCount = 0,
  remindersCount = 0,
}) => {
  const tagline = "Quick Contract Insight";
  const [displayed, setDisplayed] = useState('');
  const [showReminders, setShowReminders] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    console.log('🔔 WelcomePage received alerts:', alerts);
  }, [alerts]);

  const handleReminderClick = () => setShowReminders(true);
  const handleReminderClose = () => setShowReminders(false);
  const handleNotificationClick = () => setShowNotifications(true);
  const handleNotificationClose = () => setShowNotifications(false);

  useEffect(() => {
    let i = 0, typingTimer, pauseTimer;
    const typingSpeed = 80, pauseDelay = 1200;

    const typeLoop = () => {
      typingTimer = setInterval(() => {
        setDisplayed(tagline.slice(0, i + 1));
        i++;
        if (i > tagline.length) {
          clearInterval(typingTimer);
          pauseTimer = setTimeout(() => {
            i = 0;
            setDisplayed('');
            typeLoop();
          }, pauseDelay);
        }
      }, typingSpeed);
    };
    typeLoop();
    return () => {
      clearInterval(typingTimer);
      clearTimeout(pauseTimer);
    };
  }, [tagline]);

  return (
    <WelcomeContainer>
      <TopBar>
        <LeftLogos>
          <LogoImage src="/assets/versionwelcome.png" alt="Version1 New Logo" onError={e => { e.target.style.display = 'none'; }} />
          <LogoImage src="/assets/contractwelcome.png" alt="conTrackt New Logo" onError={e => { e.target.style.display = 'none'; }} />
        </LeftLogos>
        <RightActions>
          <NotificationButton onNotificationClick={handleNotificationClick} notificationCount={alerts.length} />
          <ReminderButton onReminderClick={handleReminderClick} reminderCount={reminders.length} />
        </RightActions>
      </TopBar>

      <WelcomeContent>
        <WelcomeTitle>Welcome</WelcomeTitle>
        <TypingTagline>{displayed}</TypingTagline>
        <ButtonRow>
          <StartButton onClick={onStartChat}>Start Chatting</StartButton>
          <PdfButton onClick={onViewAllPDFs}>View all Contracts</PdfButton>
        </ButtonRow>
      </WelcomeContent>

      <SettingsHelpButton />
      <Footer>© 2025 conTrackt. All rights reserved.</Footer>

      {showNotifications && (
        <NotificationPage onClose={handleNotificationClose} alerts={alerts} />
      )}
      {showReminders && (
        <ReminderPage onClose={handleReminderClose} reminders={reminders} />
      )}
    </WelcomeContainer>
  );
};

export default WelcomePage;
