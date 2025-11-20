import React from 'react';

// --- Color Theme ---
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

// --- Inline SVG Icons (Replaces react-icons) ---

const FaTimes = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 352 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
  </svg>
);

const FaCalendarAlt = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 448 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm32-192h384V96c0-26.5-21.5-48-48-48H368V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v32H144V16c0-8.8-7.2-16-16-16H96c-8.8 0-16 7.2-16 16v32H48C21.5 48 0 69.5 0 96v64zm304-64c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16h-32z"></path>
  </svg>
);

// --- Component Functionality (Fixed Logic) ---

// 💡 1. Accept 'reminders' from props (ChatbotPage.js already sends this)
const ReminderPage = ({ onClose, reminders }) => {
  // 💡 2. REMOVED the entire useEffect with mockReminders

  // 💡 3. This helper is fine
  const showPdfButton = (type) => true;

  // 💡 4. FIX handleViewPdf to use the correct prop
  const handleViewPdf = (viewableUrl) => {
    if (viewableUrl && viewableUrl !== '#') {
      window.open(viewableUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Don't use alert()
      console.error('PDF URL not available');
    }
  };

  return (
    <div className="reminder-container" onClick={onClose}>
      {/* This <style> tag replaces the 'styled-components' library.
        It contains all the necessary styles for this component.
      */}
      <style>
        {`
          .reminder-container {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            backdrop-filter: blur(5px);
          }

          .reminder-card {
            background: ${COLOR.background};
            border: 1px solid ${COLOR.inputBorder};
            border-radius: 20px;
            padding: 40px;
            max-width: 900px;
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
            position: relative;
            animation: fadeIn 0.35s ease;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            
            scrollbar-width: thin;
            scrollbar-color: ${COLOR.teal} ${COLOR.inputBorder};
          }

          .reminder-card::-webkit-scrollbar {
            width: 8px;
          }

          .reminder-card::-webkit-scrollbar-track {
            background: ${COLOR.inputBg};
            border-radius: 10px;
          }

          .reminder-card::-webkit-scrollbar-thumb {
            background: ${COLOR.teal};
            border-radius: 10px;
          }

          .reminder-card::-webkit-scrollbar-thumb:hover {
            background: ${COLOR.tealDark};
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .close-button {
            position: absolute;
            top: 18px;
            right: 18px;
            background: none;
            border: none;
            color: ${COLOR.secondaryText};
            font-size: 1.6rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .close-button:hover {
            color: ${COLOR.teal};
            transform: scale(1.15);
          }

          .reminder-title {
            color: ${COLOR.teal};
            margin-bottom: 35px;
            font-size: 2rem;
            text-align: center;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-shadow: none;
          }

          .reminder-text {
            color: ${COLOR.secondaryText};
            margin-bottom: 30px;
            font-style: italic;
            text-align: center;
          }

          .reminder-list {
            list-style: none;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
            gap: 25px;
            margin: 0;
            padding: 0;
          }

          .reminder-item {
            background: ${COLOR.chatBubble};
            border: 1px solid ${COLOR.inputBorder};
            border-radius: 14px;
            padding: 20px 25px;
            color: ${COLOR.primaryText};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
          }

          .reminder-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(33, 176, 190, 0.2);
            border-color: ${COLOR.teal};
          }

          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .item-date {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.7rem;
            color: ${COLOR.tealDark};
            font-weight: 600;
          }
          
          .item-title {
            font-size: 0.9rem;
            color: ${COLOR.primaryText};
            margin: 0;
            font-weight: 600;
            text-transform: capitalize;
          }

          .due-date-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 0;
            font-size: 0.85rem;
            color: ${COLOR.secondaryText};
          }

          .view-pdf-button {
            background: ${COLOR.teal};
            color: ${COLOR.chatBubble};
            border: none;
            border-radius: 8px;
            padding: 4px 10px;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 600;
            transition: background 0.2s ease, transform 0.1s ease;
          }

          .view-pdf-button:hover {
            background: ${COLOR.tealDark};
            transform: translateY(-1px);
          }

          .view-pdf-button:active {
            transform: translateY(0);
          }
        `}
      </style>

      <div className="reminder-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>

        <h2 className="reminder-title">Reminders (21–60 Days)</h2>

        {/* 💡 5. Check the *prop* for length */}
        {reminders.length === 0 ? (
          <p className="reminder-text">
            🎉 All clear! No upcoming contract renewals within the next 60 days.
          </p>
        ) : (
          <ul className="reminder-list">
            {/* 💡 6. Map over the *prop* */}
            {reminders.map((reminder) => (
              <li className="reminder-item" key={reminder.id}>
                <div className="item-header">
                  <h3 className="item-title">
                    [{reminder.type}] {reminder.title}
                  </h3>
                  <span className="item-date">
                    <FaCalendarAlt />
                    {reminder.daysLeft} days left
                  </span>
                </div>
                <p className="due-date-wrapper">
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {/* 💡 7. Use 'reminder.date' */}
                    Due: <strong>{String(reminder.date).split('T')[0]}</strong> (
                    {reminder.collection})
                  </span>

                  {showPdfButton(reminder.type) && (
                    // 💡 8. Pass the correct URL to the handler
                    <button
                      className="view-pdf-button"
                      onClick={() => handleViewPdf(reminder.viewable_url)}
                    >
                      View PDF
                    </button>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReminderPage;