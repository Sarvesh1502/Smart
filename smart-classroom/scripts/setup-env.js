const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 Smart Classroom Platform - Environment Setup\n');
  
  try {
    // Check if .env already exists
    const envPath = path.join(__dirname, '..', '.env');
    if (await fs.pathExists(envPath)) {
      const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('Setup cancelled.');
        rl.close();
        return;
      }
    }
    
    console.log('📝 Please provide the following configuration details:\n');
    
    // Basic configuration
    const nodeEnv = await question('Environment (development/production) [development]: ') || 'development';
    const platformName = await question('Platform name [Smart Classroom]: ') || 'Smart Classroom';
    
    // Database configuration
    console.log('\n🗄️  Database Configuration:');
    const mongoUri = await question('MongoDB URI [mongodb://localhost:27017/smart-classroom]: ') || 'mongodb://localhost:27017/smart-classroom';
    const mongoUsername = await question('MongoDB Username [admin]: ') || 'admin';
    const mongoPassword = await question('MongoDB Password [password123]: ') || 'password123';
    const redisUrl = await question('Redis URL [redis://localhost:6379]: ') || 'redis://localhost:6379';
    
    // Security configuration
    console.log('\n🔐 Security Configuration:');
    const jwtSecret = await question('JWT Secret (leave empty to generate): ') || generateRandomString(64);
    const jwtExpire = await question('JWT Expire [7d]: ') || '7d';
    
    // API configuration
    console.log('\n🌐 API Configuration:');
    const backendPort = await question('Backend Port [5000]: ') || '5000';
    const frontendPort = await question('Frontend Port [3000]: ') || '3000';
    const aiServicePort = await question('AI Service Port [5001]: ') || '5001';
    const mediaWorkerPort = await question('Media Worker Port [5002]: ') || '5002';
    const sheetSyncPort = await question('Sheet Sync Port [5003]: ') || '5003';
    
    // AI Services
    console.log('\n🤖 AI Services Configuration:');
    const huggingfaceKey = await question('Hugging Face API Key (optional): ');
    const openaiKey = await question('OpenAI API Key (optional): ');
    
    // Google Services
    console.log('\n📊 Google Services Configuration:');
    const googleClientId = await question('Google Client ID (optional): ');
    const googleClientSecret = await question('Google Client Secret (optional): ');
    
    // Jitsi Configuration
    console.log('\n📹 Jitsi Meet Configuration:');
    const jitsiDomain = await question('Jitsi Domain [meet.jit.si]: ') || 'meet.jit.si';
    const jitsiAppId = await question('Jitsi App ID (optional): ');
    const jitsiAppSecret = await question('Jitsi App Secret (optional): ');
    
    // Email Configuration
    console.log('\n📧 Email Configuration:');
    const smtpHost = await question('SMTP Host [smtp.gmail.com]: ') || 'smtp.gmail.com';
    const smtpPort = await question('SMTP Port [587]: ') || '587';
    const smtpUser = await question('SMTP Username (optional): ');
    const smtpPass = await question('SMTP Password (optional): ');
    
    // Generate .env content
    const envContent = generateEnvContent({
      nodeEnv,
      platformName,
      mongoUri,
      mongoUsername,
      mongoPassword,
      redisUrl,
      jwtSecret,
      jwtExpire,
      backendPort,
      frontendPort,
      aiServicePort,
      mediaWorkerPort,
      sheetSyncPort,
      huggingfaceKey,
      openaiKey,
      googleClientId,
      googleClientSecret,
      jitsiDomain,
      jitsiAppId,
      jitsiAppSecret,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass
    });
    
    // Write .env file
    await fs.writeFile(envPath, envContent);
    console.log('\n✅ Environment configuration saved to .env');
    
    // Create service-specific .env files
    await createServiceEnvFiles({
      backendPort,
      frontendPort,
      aiServicePort,
      mediaWorkerPort,
      sheetSyncPort,
      mongoUri,
      redisUrl,
      jwtSecret,
      jwtExpire,
      huggingfaceKey,
      openaiKey,
      googleClientId,
      googleClientSecret,
      jitsiDomain,
      jitsiAppId,
      jitsiAppSecret,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass
    });
    
    console.log('\n🎉 Environment setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the generated .env files');
    console.log('2. Install dependencies: npm run setup:install');
    console.log('3. Start the development servers: npm run dev');
    console.log('4. Seed the database: npm run seed');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateEnvContent(config) {
  return `# Smart Classroom Platform - Environment Configuration
# Generated on ${new Date().toISOString()}

# =============================================================================
# GLOBAL CONFIGURATION
# =============================================================================
NODE_ENV=${config.nodeEnv}
PLATFORM_NAME=${config.platformName}
PLATFORM_VERSION=1.0.0

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
MONGODB_URI=${config.mongoUri}
MONGODB_USERNAME=${config.mongoUsername}
MONGODB_PASSWORD=${config.mongoPassword}
MONGODB_DATABASE=smart-classroom

# Redis Configuration
REDIS_URL=${config.redisUrl}
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# =============================================================================
# AUTHENTICATION & SECURITY
# =============================================================================
JWT_SECRET=${config.jwtSecret}
JWT_EXPIRE=${config.jwtExpire}
JWT_REFRESH_SECRET=${generateRandomString(32)}
JWT_REFRESH_EXPIRE=30d

# Password hashing
BCRYPT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=http://localhost:${config.frontendPort}
CORS_CREDENTIALS=true

# =============================================================================
# API CONFIGURATION
# =============================================================================
# Backend API
BACKEND_PORT=${config.backendPort}
BACKEND_URL=http://localhost:${config.backendPort}

# Frontend
FRONTEND_PORT=${config.frontendPort}
FRONTEND_URL=http://localhost:${config.frontendPort}

# AI Service
AI_SERVICE_PORT=${config.aiServicePort}
AI_SERVICE_URL=http://localhost:${config.aiServicePort}

# Media Worker
MEDIA_WORKER_PORT=${config.mediaWorkerPort}
MEDIA_WORKER_URL=http://localhost:${config.mediaWorkerPort}

# Sheet Sync Service
SHEET_SYNC_PORT=${config.sheetSyncPort}
SHEET_SYNC_URL=http://localhost:${config.sheetSyncPort}

# =============================================================================
# AI SERVICES CONFIGURATION
# =============================================================================
# Hugging Face
HUGGINGFACE_API_KEY=${config.huggingfaceKey || 'your-huggingface-api-key'}
HUGGINGFACE_MODEL_CACHE_DIR=./models

# OpenAI (optional)
OPENAI_API_KEY=${config.openaiKey || 'your-openai-api-key'}

# Vosk Speech Recognition
VOSK_MODEL_PATH=./models/vosk-model-en-us-0.22
VOSK_MODEL_URL=https://alphacephei.com/vosk/models

# Whisper (alternative to Vosk)
WHISPER_MODEL=base
WHISPER_LANGUAGE=en

# =============================================================================
# GOOGLE SERVICES CONFIGURATION
# =============================================================================
# Google Sheets API
GOOGLE_CLIENT_ID=${config.googleClientId || 'your-google-client-id'}
GOOGLE_CLIENT_SECRET=${config.googleClientSecret || 'your-google-client-secret'}
GOOGLE_REDIRECT_URI=http://localhost:${config.sheetSyncPort}/auth/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/drive.file

# =============================================================================
# JITSI MEET CONFIGURATION
# =============================================================================
JITSI_DOMAIN=${config.jitsiDomain}
JITSI_APP_ID=${config.jitsiAppId || 'your-jitsi-app-id'}
JITSI_APP_SECRET=${config.jitsiAppSecret || 'your-jitsi-app-secret'}
JITSI_ROOM_PREFIX=smart-classroom

# =============================================================================
# MEDIA PROCESSING CONFIGURATION
# =============================================================================
# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg
FFMPEG_THREADS=4

# Video Processing
VIDEO_QUALITY_LOW=480p
VIDEO_QUALITY_MEDIUM=720p
VIDEO_QUALITY_HIGH=1080p
VIDEO_BITRATE_LOW=500k
VIDEO_BITRATE_MEDIUM=1500k
VIDEO_BITRATE_HIGH=3000k

# Audio Processing
AUDIO_BITRATE=128k
AUDIO_SAMPLE_RATE=44100
AUDIO_CHANNELS=2

# File Upload
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=mp4,avi,mov,mkv,mp3,wav,aac,pdf,doc,docx,ppt,pptx

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
SMTP_HOST=${config.smtpHost}
SMTP_PORT=${config.smtpPort}
SMTP_SECURE=false
SMTP_USER=${config.smtpUser || 'your-email@gmail.com'}
SMTP_PASS=${config.smtpPass || 'your-app-password'}
FROM_EMAIL=noreply@smartclassroom.com
FROM_NAME=Smart Classroom

# =============================================================================
# RATE LIMITING
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_DATE_PATTERN=YYYY-MM-DD

# =============================================================================
# FEATURE FLAGS
# =============================================================================
ENABLE_LIVE_STREAMING=true
ENABLE_AI_DOUBT_RESOLUTION=true
ENABLE_GOOGLE_SHEETS_SYNC=true
ENABLE_OFFLINE_MODE=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_ANALYTICS=true

# =============================================================================
# DEVELOPMENT CONFIGURATION
# =============================================================================
DEBUG=smart-classroom:*
HOT_RELOAD=true
MOCK_AI_RESPONSES=false
MOCK_GOOGLE_SHEETS=false
`;
}

async function createServiceEnvFiles(config) {
  const services = [
    {
      name: 'backend',
      path: path.join(__dirname, '..', 'backend', '.env'),
      content: `NODE_ENV=${config.nodeEnv || 'development'}
PORT=${config.backendPort}
MONGODB_URI=${config.mongoUri}
REDIS_URL=${config.redisUrl}
JWT_SECRET=${config.jwtSecret}
JWT_EXPIRE=${config.jwtExpire}
FRONTEND_URL=http://localhost:${config.frontendPort}
AI_SERVICE_URL=http://localhost:${config.aiServicePort}
MEDIA_WORKER_URL=http://localhost:${config.mediaWorkerPort}
SHEET_SYNC_URL=http://localhost:${config.sheetSyncPort}
GOOGLE_CLIENT_ID=${config.googleClientId || 'your-google-client-id'}
GOOGLE_CLIENT_SECRET=${config.googleClientSecret || 'your-google-client-secret'}
JITSI_DOMAIN=${config.jitsiDomain}
JITSI_APP_ID=${config.jitsiAppId || 'your-jitsi-app-id'}
JITSI_APP_SECRET=${config.jitsiAppSecret || 'your-jitsi-app-secret'}
SMTP_HOST=${config.smtpHost}
SMTP_PORT=${config.smtpPort}
SMTP_USER=${config.smtpUser || 'your-email@gmail.com'}
SMTP_PASS=${config.smtpPass || 'your-app-password'}
`
    },
    {
      name: 'ai-service',
      path: path.join(__dirname, '..', 'ai-service', '.env'),
      content: `NODE_ENV=${config.nodeEnv || 'development'}
PORT=${config.aiServicePort}
HUGGINGFACE_API_KEY=${config.huggingfaceKey || 'your-huggingface-api-key'}
OPENAI_API_KEY=${config.openaiKey || 'your-openai-api-key'}
VOSK_MODEL_PATH=./models/vosk-model-en-us-0.22
`
    },
    {
      name: 'media-worker',
      path: path.join(__dirname, '..', 'media-worker', '.env'),
      content: `NODE_ENV=${config.nodeEnv || 'development'}
PORT=${config.mediaWorkerPort}
REDIS_URL=${config.redisUrl}
FFMPEG_PATH=/usr/bin/ffmpeg
`
    },
    {
      name: 'sheet-sync',
      path: path.join(__dirname, '..', 'sheet-sync', '.env'),
      content: `NODE_ENV=${config.nodeEnv || 'development'}
PORT=${config.sheetSyncPort}
GOOGLE_CLIENT_ID=${config.googleClientId || 'your-google-client-id'}
GOOGLE_CLIENT_SECRET=${config.googleClientSecret || 'your-google-client-secret'}
GOOGLE_REDIRECT_URI=http://localhost:${config.sheetSyncPort}/auth/google/callback
`
    }
  ];
  
  for (const service of services) {
    await fs.writeFile(service.path, service.content);
    console.log(`✅ Created ${service.name} .env file`);
  }
}

// Run if called directly
if (require.main === module) {
  setupEnvironment();
}

module.exports = { setupEnvironment };
