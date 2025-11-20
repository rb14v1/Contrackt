# conTrackt Chatbot - React Full-Stack Application

A modern, full-stack chatbot application built with React and Express.js, featuring voice input capabilities and contract analysis functionality for Version1.

## 🚀 Features

- **Modern React Frontend** with styled-components
- **Express.js Backend** with RESTful API
- **Google Gemini AI** integration for intelligent responses
- **Voice Input/Output** with Web Speech API
- **Chat History** with localStorage persistence
- **Contract Categories** with highlighting effects
- **Responsive Design** with mobile support
- **Real-time Communication** between frontend and backend
- **Fallback System** - Local responses if AI fails

## 🎨 UI Improvements

This React conversion includes the requested improvements:

1. **Corrected Logo Alignment** - Both Version1 and conTrackt logos are properly aligned and sized
2. **Category Highlighter Box** - Beautiful hover effects and highlighting for all 7 contract categories
3. **New Chat Button** - Prominently placed "New Chat" button for easy conversation management
4. **Enhanced Styling** - Modern gradient backgrounds and smooth animations

## 📁 Project Structure

```
chatbot-react/
├── public/
│   ├── index.html
│   └── assets/           # Logo images (need to be added)
├── src/
│   ├── components/
│   │   ├── WelcomePage.js
│   │   ├── ChatbotPage.js
│   │   ├── Sidebar.js
│   │   ├── ChatArea.js
│   │   ├── InputArea.js
│   │   └── Modal.js
│   ├── hooks/
│   │   ├── useChatHistory.js
│   │   ├── useVoiceInput.js
│   │   └── useTTS.js
│   ├── styles/
│   │   └── GlobalStyles.js
│   ├── utils/
│   │   └── chatbotLogic.js
│   ├── App.js
│   └── index.js
├── backend/
│   ├── controllers/
│   │   └── chatController.js
│   ├── routes/
│   │   ├── chatRoutes.js
│   │   └── healthRoutes.js
│   └── server.js
├── package.json
├── .env
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /Users/kowshik/Desktop/Chatbot/chatbot-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify Gemini AI configuration:**
   The Google Gemini API key is already configured in `.env`:
   ```env
   GEMINI_API_KEY=AIzaSyDnRBwLwRxfaTTqQ7jVnhsuEBBy5dHyZW4
   ```

4. **Add logo images:**
   Copy your logo images to the `public/assets/` directory:
   - `firstlogoteal.jpg` - Version1 logo for welcome page
   - `logo2.jpg` - conTrackt logo for welcome page  
   - `secondversionblue.jpg` - Version1 logo for sidebar
   - `secondconblue.jpg` - conTrackt logo for sidebar

### Development

1. **Start the development servers:**
   ```bash
   npm run dev
   ```
   This runs both frontend (React) and backend (Express) concurrently.

   Or run them separately:
   ```bash
   # Terminal 1 - Backend server
   npm run server

   # Terminal 2 - React frontend
   npm run client
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

### Production Build

1. **Build the React app:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## 🎯 API Endpoints

### Chat API
- `POST /api/chat/message` - Send message and get AI-powered bot response
- `GET /api/chat/categories` - Get contract categories

### Health Check
- `GET /api/health` - Server health status and features
- `GET /api/health/gemini` - Test Google Gemini AI connection

## 🎙️ Voice Features

- **Speech Recognition** - Click the microphone to start voice input
- **Text-to-Speech** - Bot responses are spoken aloud
- **Voice States** - Recording → Review → Confirm workflow

## 💾 Data Storage

- **Chat History** - Stored in browser's localStorage (max 5 conversations)
- **Session Management** - Automatic saving and loading of conversations
- **Future Enhancement** - Ready for Firebase Firestore integration

## 🎨 Theming

The application uses CSS custom properties for consistent theming:

- **Primary Colors**: Deep navy blue (#0C1E2B) and teal (#17374D)
- **Accent Color**: Sparkling cyan (#00E5C9)
- **Typography**: Inter font family
- **Animations**: Smooth transitions and hover effects

## 🔧 Environment Variables

The `.env` file is already configured with:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
PORT=3000
BACKEND_PORT=5000

# Google Gemini AI API
GEMINI_API_KEY=AIzaSyDnRBwLwRxfaTTqQ7jVnhsuEBBy5dHyZW4
```

## 📱 Browser Compatibility

- **Modern Browsers** - Chrome, Firefox, Safari, Edge (latest versions)
- **Voice Features** - Requires browser support for Web Speech API
- **Mobile Support** - Responsive design works on mobile devices

## 🚀 Deployment

### Heroku Deployment

1. **Install Heroku CLI**
2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```
3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   ```
4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Docker Deployment

The application is ready for containerization with Docker.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- [ ] Firebase Firestore integration
- [ ] User authentication
- [ ] Real-time chat with WebSockets
- [ ] File upload for contract analysis
- [ ] Advanced AI integration (OpenAI GPT)
- [ ] Export chat history
- [ ] Dark/Light theme toggle

## 🔗 Version1 Integration

This chatbot is designed specifically for Version1's contract analysis needs and includes:

- Version1 branding and logos
- Contract-specific terminology
- Business-focused responses
- Professional styling and UX