# Smart Classroom Platform

A comprehensive educational technology platform designed for rural areas with low bandwidth connectivity. Built with modern web technologies and optimized for 25-50 KB/s internet connections.

## 🚀 Features

### Core Features
- **Live Video Streaming** - Jitsi Meet integration for real-time classes
- **Recorded Lectures** - HLS/DASH video streaming with adaptive quality
- **AI-Powered Doubt Resolution** - GenAI + RAG pipeline with IndicSBERT
- **Google Sheets Integration** - Teacher data management and sync
- **Multi-language Support** - English, Hindi, Tamil, Telugu, Bengali, and more
- **Low Bandwidth Optimized** - Works on 25-50 KB/s connections
- **Offline Support** - Service workers for offline content access

### User Roles
- **Students** - Access courses, submit assignments, join live classes
- **Teachers** - Create content, manage classes, track progress
- **Administrators** - Platform management, user oversight, analytics

## 🏗️ Architecture

```
smart-classroom/
├── frontend/          # React/Next.js PWA
├── backend/           # Node.js + Express API
├── ai-service/        # GenAI + RAG pipeline
├── media-worker/      # FFmpeg video processing
├── sheet-sync/        # Google Sheets integration
└── scripts/           # Deployment utilities
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Next.js 14** for SSR/SSG
- **Tailwind CSS** for styling
- **Radix UI** for components
- **PWA** capabilities

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for real-time features
- **JWT** authentication
- **Redis** for caching

### AI Services
- **Hugging Face** models
- **IndicSBERT** for multilingual embeddings
- **Vosk/Whisper** for speech recognition
- **gTTS** for text-to-speech

### Media Processing
- **FFmpeg** for video transcoding
- **HLS/DASH** streaming
- **Sharp** for image processing

### Infrastructure
- **Docker** containerization
- **Nginx** reverse proxy
- **MongoDB** database
- **Redis** cache

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB
- Redis

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/smart-classroom.git
cd smart-classroom
```

2. **Install dependencies**
```bash
npm run setup
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start with Docker**
```bash
npm run docker:up
```

5. **Or start in development mode**
```bash
npm run dev
```

## 📁 Project Structure

### Frontend (`/frontend`)
```
src/
├── components/        # Reusable UI components
│   ├── Auth/         # Authentication components
│   ├── Dashboard/    # Dashboard components
│   ├── LiveSession/  # Jitsi/WebRTC wrappers
│   ├── Player/       # HLS/DASH player
│   ├── SlidesViewer/ # PDF/slide viewer
│   ├── QuizPolls/    # Interactive elements
│   ├── DoubtBot/     # AI chat interface
│   └── TeacherSheet/ # Spreadsheet UI
├── pages/            # Next.js pages
├── services/         # API calls, WebRTC
├── hooks/            # Custom React hooks
├── store/            # State management
├── utils/            # Helper functions
└── workers/          # Service workers
```

### Backend (`/backend`)
```
src/
├── api/              # REST endpoints
├── sockets/          # Socket.IO handlers
├── models/           # MongoDB schemas
├── services/         # Business logic
├── utils/            # Helper functions
└── config/           # Configuration
```

### AI Service (`/ai-service`)
```
├── embeddings/       # Vector embeddings
├── models/           # AI models
├── ragPipeline.js    # RAG implementation
├── transcription.js  # Speech recognition
└── tts.js           # Text-to-speech
```

### Media Worker (`/media-worker`)
```
├── jobs/             # FFmpeg jobs
├── utils/            # Media utilities
└── worker.js         # Main worker
```

### Sheet Sync (`/sheet-sync`)
```
├── googleAPI/        # Google Sheets API
├── syncHandlers/     # Sync logic
└── server.js         # Main server
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service directory:

#### Backend (`.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-classroom
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

#### AI Service (`.env`)
```env
HUGGINGFACE_API_KEY=your-huggingface-key
VOSK_MODEL_PATH=./models/vosk-model
```

#### Sheet Sync (`.env`)
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Manual Deployment
```bash
# Build all services
npm run build

# Start production servers
npm start
```

## 📊 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course details

### Lectures
- `GET /api/lectures/course/:courseId` - List lectures
- `POST /api/lectures` - Create lecture
- `GET /api/lectures/:id/live-session` - Get live session info

### AI Services
- `POST /api/ai/doubt-response` - Get AI response
- `POST /api/ai/transcribe/audio` - Transcribe audio
- `POST /api/ai/tts/generate` - Generate speech

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific service
npm run test:frontend
npm run test:backend
npm run test:ai
```

## 📈 Performance

### Optimizations
- **Video Streaming**: Adaptive bitrate with HLS
- **Image Optimization**: WebP format with fallbacks
- **Code Splitting**: Lazy loading of components
- **Caching**: Redis for API responses
- **CDN**: Static asset delivery

### Bandwidth Requirements
- **Minimum**: 25 KB/s for basic functionality
- **Recommended**: 50 KB/s for smooth video streaming
- **Optimal**: 100+ KB/s for best experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-org/smart-classroom/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/smart-classroom/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/smart-classroom/discussions)

## 🙏 Acknowledgments

- **Government of Rajasthan** for supporting rural education
- **Open source community** for the amazing tools and libraries
- **Contributors** who help improve the platform

---

**Built with ❤️ for rural education in India**
