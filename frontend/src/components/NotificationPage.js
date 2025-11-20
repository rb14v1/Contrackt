import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaBell, FaCalendarAlt } from 'react-icons/fa';
 
// 1. ADDED: Color theme from WelcomePage.js
const COLOR = {
  background: '#F5F5F5',
  chatBubble: '#FFFFFF',
  inputBg: '#FAFAFA',
  inputBorder: '#E0E0E0',
  accentPurple: '#7E57C2',
  deepPurple: '#5E35B1',
  teal: '#21b0be',
  tealDark: '#159da9', 
  primaryText: '#212121', // This is the color used for the Title
  secondaryText: '#757575',
  placeholderText: '#BDBDBD',
};
 
// --- Styled Components (Updated with new COLOR theme) ---
 
const FullScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: ${COLOR.background}; /* UPDATED */
  z-index: 2000;
  display: flex;
  flex-direction: column;
  color: ${COLOR.primaryText}; /* UPDATED */
  overflow: hidden;
`;
 
const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: ${COLOR.chatBubble}; /* UPDATED */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* UPDATED */
  border-bottom: 1px solid ${COLOR.inputBorder}; /* ADDED */
  min-height: 80px;
`;
 
const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${COLOR.primaryText}; /* SET TO BLACK/PRIMARY TEXT COLOR */
  margin: 0;
  text-shadow: none; /* UPDATED */
`;

// MODIFIED: Subtitle for big, bold, single-line text (no ellipsis/clipping)
const Subtitle = styled.p`
  font-size: 1.1rem; /* INCREASED SIZE */
  color: ${COLOR.teal}; /* BRIGHTER TEAL FOR SUBTITLE */
  margin: 5px 0 0 0;
  line-height: 1; /* Reduced line height to encourage single line */
  max-width: 900px; /* Increased max width */
  font-weight: bold; /* Made bold */
  white-space: nowrap; /* Ensures content stays on a single line */
  /* Removed overflow: hidden and text-overflow: ellipsis to prevent '...' */
`;
 
const CancelButton = styled.button`
  background: none;
  border: none;
  color: ${COLOR.secondaryText}; /* UPDATED */
  font-size: 32px;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
  padding: 8px;
  border-radius: 50%;
 
  &:hover {
    color: ${COLOR.teal}; /* UPDATED */
    transform: rotate(90deg);
  }
`;
 
const TwoColumnLayout = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;
 
const LayoutHeader = styled.h2`
  font-size: 1.5rem;
  color: ${COLOR.primaryText}; /* UPDATED */
  margin: 0 0 20px 0;
  padding: 0 0 10px 0;
  border-bottom: 2px solid ${COLOR.teal}40; /* UPDATED */
`;
 
const PreviewLayout = styled.div`
  flex: 2;
  padding: 40px;
  overflow-y: auto;
  border-right: 1px solid ${COLOR.inputBorder}; /* UPDATED */
  background: ${COLOR.chatBubble}; /* UPDATED */
`;
 
const ListLayout = styled.div`
  flex: 1.2;
  min-width: 350px;
  max-width: 500px;
  overflow-y: auto;
  background: ${COLOR.inputBg}; /* UPDATED */
  padding: 40px;
  box-shadow: inset 3px 0 15px rgba(0, 0, 0, 0.05); /* UPDATED */
`;
 
const AlertItem = styled.div`
  padding: 15px 0;
  border-bottom: 1px solid ${COLOR.inputBorder}; /* UPDATED */
  cursor: pointer;
  background-color: ${props => props.isSelected ? `${COLOR.teal}15` : 'transparent'}; /* UPDATED */
  transition: background-color 0.15s ease;
  border-left: 4px solid ${props => props.daysLeft <= 7 ? '#ff4d4f' : '#f39c12'};
  padding-left: 10px;
 
  &:hover {
    background-color: ${COLOR.teal}10; /* UPDATED */
  }
`;
 
const AlertTitle = styled.h3`
  font-size: 1.1rem;
  margin: 0 0 5px 0;
  color: ${props => props.daysLeft <= 7 ? '#ff4d4f' : '#f39c12'};
  /* Color is dynamic, so it stays */
`;
 
// MODIFIED: Use flexbox to align date text and button horizontally
const AlertDate = styled.p`
  font-size: 0.85rem;
  color: ${COLOR.secondaryText}; /* UPDATED */
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Pushes the button to the right */
  gap: 5px;
`;

// NEW Styled Component for the View PDF button
const ViewPdfButton = styled.button`
  background: ${COLOR.teal};
  color: ${COLOR.chatBubble};
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.1s ease;

  &:hover {
    background: ${COLOR.tealDark};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;
 
const PreviewContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;
 
const Placeholder = styled.div`
  text-align: center;
  margin-top: 50px;
  color: ${COLOR.secondaryText}; /* UPDATED */
  font-size: 1.2rem;
 
  svg {
    font-size: 4rem;
    margin-bottom: 20px;
    color: ${COLOR.teal}; /* UPDATED */
  }
`;
 
const PreviewTitle = styled.h2`
  font-size: 2rem;
  color: ${COLOR.teal}; /* UPDATED */
  margin-bottom: 20px;
  text-shadow: none; /* UPDATED */
`;
 
const PreviewBody = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${COLOR.primaryText}; /* UPDATED */
`;
 
const DetailLine = styled.p`
  font-size: 1rem;
  color: ${COLOR.secondaryText}; /* UPDATED */
  margin: 5px 0;
`;
 
// --- Component ---
const NotificationPage = ({ onClose, alerts = [] }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
 
  const sortedAlerts = useMemo(() => alerts || [], [alerts]);
 
  useEffect(() => {
    if (!selectedAlert && sortedAlerts.length > 0) {
      setSelectedAlert(sortedAlerts[0]);
    }
  }, [selectedAlert, sortedAlerts]);

  // handler for the button
  // 💡 4. FIX handleViewPdf to use the correct prop
  const handleViewPdf = (viewableUrl) => {
    if (viewableUrl && viewableUrl !== '#') {
      window.open(viewableUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Don't use alert()
      console.error('PDF URL not available');
    }
  };

  // Helper function to show the button on all items (as per request)
  // For production, you might filter based on alert.type here.
  const showPdfButton = () => true;
 
  return (
    <FullScreenContainer>
      <Header>
        <HeaderContent>
          <Title>Urgent Alerts (0-20 Days)</Title>
          <Subtitle>
            Here is your list of upcoming urgent contracts and agreements due in the next 20 days. Review them now to take quick action.
          </Subtitle>
        </HeaderContent>
        <CancelButton onClick={onClose} title="Back to Chatbot">
          <FaTimes />
        </CancelButton>
      </Header>
 
      <TwoColumnLayout>
        {/* LEFT: Alert Preview */}
        <PreviewLayout>
          <LayoutHeader>Alert Details</LayoutHeader>
          <PreviewContent>
            {selectedAlert ? (
              <>
                <PreviewTitle>{selectedAlert.title}</PreviewTitle>
                <DetailLine>
                  <FaCalendarAlt style={{ marginRight: '5px' }} />
                  Due Date: {selectedAlert.date.split('T')[0]}
                </DetailLine>
                <DetailLine>
                  Time Remaining: <strong>{selectedAlert.daysLeft} days</strong>
                </DetailLine>
                <DetailLine>
                  Type: {selectedAlert.type.toUpperCase().replace('-', ' ')}
                </DetailLine>
                <DetailLine>
                  Collection: {selectedAlert.collection}
                </DetailLine>
                <hr style={{ margin: '20px 0', borderColor: COLOR.inputBorder }} /> {/* UPDATED */}
                <PreviewBody>
                  <strong>Action Required:</strong> This contract is highly urgent. Please review
                  the details and initiate the <strong>{selectedAlert.type.toUpperCase().replace('-', ' ')}</strong> process immediately.
                  <br /><br />
                  (In a full system, a link to the original document or an action button would be displayed here.)
                </PreviewBody>
              </>
            ) : (
              <Placeholder>
                <FaBell />
                <p>Select an alert from the right column to see its details.</p>
              </Placeholder>
            )}
          </PreviewContent>
        </PreviewLayout>
 
        {/* RIGHT: Alert List */}
        <ListLayout>
          <LayoutHeader>Alerts List ({sortedAlerts.length})</LayoutHeader>
          {sortedAlerts.map(alert => (
            <AlertItem
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              isSelected={selectedAlert && selectedAlert.id === alert.id}
              daysLeft={alert.daysLeft}
            >
              <AlertTitle daysLeft={alert.daysLeft}>
                [{alert.type.toUpperCase().split('-')[0]}] {alert.title}
              </AlertTitle>
              {/* MODIFIED: Wrapped date text in a span for organization */}
              <AlertDate>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCalendarAlt />
                  <strong>{alert.daysLeft}</strong> days left (Due: {alert.date.split('T')[0]})
                </span>

                {/* ADDED: View PDF Button */}
                {showPdfButton() && (
                  <ViewPdfButton onClick={(e) => handleViewPdf(alert.viewable_url)}>
                    View PDF
                  </ViewPdfButton>
                )}
              </AlertDate>
            </AlertItem>
          ))}
          {sortedAlerts.length === 0 && (
            <Placeholder style={{ padding: '20px', marginTop: '50px' }}>
              <p>No urgent alerts to display (0-20 days).</p>
            </Placeholder>
          )}
        </ListLayout>
      </TwoColumnLayout>
    </FullScreenContainer>
  );
};
 
export default NotificationPage;