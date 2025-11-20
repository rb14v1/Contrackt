import React from 'react';
import styled from 'styled-components';
import { FaBell } from 'react-icons/fa';

// --- Styled Components ---

const NotificationButtonContainer = styled.div`
  /* Position relative for the notification badge */
  position: relative;
  /* Add some margin to separate it from other header actions */
  margin-right: 15px; 
`;

const NotificationIcon = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: white;
  color: teal;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  font-size: 18px;

  &:hover {
    background: #e0e0e0;
    color: var(--card);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(7, 212, 188, 0.4);
`;

const Badge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ff4757; /* Red color for notifications */
  color: white;
  border-radius: 50%;
  padding: 3px 6px;
  font-size: 10px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
  /* Ensure it is visible above other elements */
  z-index: 10;
`;


// --- Component ---

/**
 * Renders a clickable bell icon for notifications with an optional badge.
 * @param {function} onNotificationClick - Function to execute when the button is clicked.
 * @param {number} notificationCount - Optional number of pending notifications to display in a badge.
 */
const NotificationButton = ({ onNotificationClick, notificationCount = 0 }) => {
    
    // Placeholder function for the actual click action
    const handleClick = () => {
        if (onNotificationClick) {
            onNotificationClick();
        }
        // You can add your modal or notification list logic here
        console.log('Notification button clicked! Count:', notificationCount);
    };
    
    return (
        <NotificationButtonContainer>
            <NotificationIcon onClick={handleClick} title="Notifications">
                <FaBell />
            </NotificationIcon>
            {/* Display badge if count is greater than 0 */}
            {notificationCount > 0 && <Badge>{notificationCount > 9 ? '9+' : notificationCount}</Badge>}
        </NotificationButtonContainer>
    );
};

export default NotificationButton;