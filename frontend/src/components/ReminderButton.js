import React from 'react';
import styled from 'styled-components';
import { FaClock } from 'react-icons/fa';

// --- Styled Components ---

const ReminderButtonContainer = styled.div`
  position: relative;
  margin-right: 15px;
`;

const ReminderIcon = styled.button`
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
    color: #21b0be;
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
`;

// --- Component ---

const ReminderButton = ({ reminderCount = 0, onReminderClick }) => {
  const handleClick = () => {
    if (onReminderClick) onReminderClick();
  };

  return (
    <ReminderButtonContainer>
      <ReminderIcon onClick={handleClick} title="Contract Reminders">
        <FaClock />
      </ReminderIcon>

      {reminderCount > 0 && <Badge>{reminderCount}</Badge>}
    </ReminderButtonContainer>
  );
};

export default ReminderButton;
