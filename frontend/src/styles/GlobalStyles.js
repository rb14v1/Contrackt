import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

  :root {
    --bg: #F5F5F5;                        /* Main background */
    --sidebar-bg: #FFFFFF;                 /* Sidebar, chat cards */
    --sidebar-item-bg: #FAFAFA;            /* Input fields, off-white cards */
    --sidebar-item-hover: #E0E0E0;         /* Hovered card border */
    --sidebar-item-active: #E0E0E0;        /* Active card/focus border */
    --border: #E0E0E0;                     /* Light gray border */
    --text: #212121;                       /* Primary (dark gray/black) text */
    --secondary-text: #757575;             /* Medium gray */
    --placeholder: #BDBDBD;                /* Input placeholder */
    --accent-teal: #21b0be;                /* Teal accent (used for branding/buttons) */
    --accent-purple: #7E57C2;              /* Highlight purple */
    --deep-purple: #5E35B1;                /* Button/active element deep purple */
    --shadow-color: rgba(33, 176, 190, 0.07);   /* Subtle shadow for cards */
    /* Other accent colors unchanged */
    --mic-active-red: #ff3b30;
    --mic-active-green: #00bf63;
    --tick-color: #00bf63;
    --cross-color: #ff3b30;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  body {
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    height: 100vh;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 10px;
    background: transparent;
  }
  ::-webkit-scrollbar-track {
    background: var(--sidebar-bg);
  }
  ::-webkit-scrollbar-thumb {
    background-color: var(--accent-teal);
    border-radius: 6px;
    border: 3px solid var(--sidebar-item-bg);
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: #159da9;
  }

  /* Inputs and textarea */
  input, textarea {
    background: var(--sidebar-item-bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 10px;
    outline: none;
    caret-color: var(--accent-teal);
  }
  input::placeholder, textarea::placeholder {
    color: var(--placeholder);
    opacity: 1;
  }
  input:focus, textarea:focus {
    box-shadow: 0 0 8px var(--accent-teal);
    border-color: var(--accent-teal);
  }

  /* Mic Button/Icon */
  .mic-button, .mic-icon {
    color: var(--accent-teal);
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.3s ease, transform 0.2s ease;
  }
  .mic-button:hover, .mic-icon:hover {
    color: #44FFD2;
    transform: scale(1.15);
  }
  .mic-active {
    color: var(--mic-active-green) !important;
    text-shadow: 0 0 8px var(--mic-active-green);
  }

  /* Text selection */
  ::selection {
    background: var(--accent-teal);
    color: var(--sidebar-bg);
  }
`;
