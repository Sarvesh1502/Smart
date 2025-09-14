const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import services
const ragPipeline = require('./ragPipeline');
const transcriptionService = require('./transcription');
const ttsService = require('./tts');
const embeddingService = require('./embeddings/generateEmbeddings');
const vectorSearchService = require('./embeddings/vectorSearch');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'AI Service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    models: {
      'IndicSBERT': 'loaded',
      'Vosk': 'loaded',
      'Whisper': 'loaded',
      'gTTS': 'loaded'
    }
  });
});

// RAG Pipeline endpoints
app.post('/api/rag/query', async (req, res) => {
  try {
    const { question, context, language = 'en' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await ragPipeline.processQuery(question, context, language);
    
    res.json({
      success: true,
      answer: response.answer,
      confidence: response.confidence,
      sources: response.sources,
      language: response.language
    });
  } catch (error) {
    console.error('RAG query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Transcription endpoints
app.post('/api/transcribe/audio', async (req, res) => {
  try {
    const { audioUrl, language = 'en', format = 'mp3' } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'Audio URL is required' });
    }

    const transcription = await transcriptionService.transcribeAudio(audioUrl, language, format);
    
    res.json({
      success: true,
      transcription: transcription.text,
      confidence: transcription.confidence,
      language: transcription.language,
      segments: transcription.segments
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

app.post('/api/transcribe/video', async (req, res) => {
  try {
    const { videoUrl, language = 'en' } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const transcription = await transcriptionService.transcribeVideo(videoUrl, language);
    
    res.json({
      success: true,
      transcription: transcription.text,
      confidence: transcription.confidence,
      language: transcription.language,
      segments: transcription.segments
    });
  } catch (error) {
    console.error('Video transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe video' });
  }
});

// Text-to-Speech endpoints
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, language = 'en', voice = 'default' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ttsResult = await ttsService.generateSpeech(text, language, voice);
    
    res.json({
      success: true,
      audioUrl: ttsResult.audioUrl,
      duration: ttsResult.duration,
      language: ttsResult.language,
      voice: ttsResult.voice
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Embeddings endpoints
app.post('/api/embeddings/generate', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embedding = await embeddingService.generateEmbedding(text, language);
    
    res.json({
      success: true,
      embedding: embedding.vector,
      model: embedding.model,
      language: embedding.language
    });
  } catch (error) {
    console.error('Embedding generation error:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});

app.post('/api/embeddings/batch', async (req, res) => {
  try {
    const { texts, language = 'en' } = req.body;
    
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    const embeddings = await embeddingService.generateBatchEmbeddings(texts, language);
    
    res.json({
      success: true,
      embeddings: embeddings,
      count: embeddings.length
    });
  } catch (error) {
    console.error('Batch embedding generation error:', error);
    res.status(500).json({ error: 'Failed to generate batch embeddings' });
  }
});

// Vector search endpoints
app.post('/api/vector/search', async (req, res) => {
  try {
    const { query, limit = 10, threshold = 0.7, language = 'en' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await vectorSearchService.searchSimilar(query, limit, threshold, language);
    
    res.json({
      success: true,
      results: results,
      query: query,
      count: results.length
    });
  } catch (error) {
    console.error('Vector search error:', error);
    res.status(500).json({ error: 'Failed to perform vector search' });
  }
});

// Language detection endpoint
app.post('/api/language/detect', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const language = await ragPipeline.detectLanguage(text);
    
    res.json({
      success: true,
      language: language.code,
      confidence: language.confidence,
      name: language.name
    });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ error: 'Failed to detect language' });
  }
});

// Question classification endpoint
app.post('/api/classify/question', async (req, res) => {
  try {
    const { question, language = 'en' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const classification = await ragPipeline.classifyQuestion(question, language);
    
    res.json({
      success: true,
      category: classification.category,
      subcategory: classification.subcategory,
      confidence: classification.confidence,
      tags: classification.tags
    });
  } catch (error) {
    console.error('Question classification error:', error);
    res.status(500).json({ error: 'Failed to classify question' });
  }
});

// Answer quality assessment endpoint
app.post('/api/assess/answer', async (req, res) => {
  try {
    const { question, answer, language = 'en' } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const assessment = await ragPipeline.assessAnswerQuality(question, answer, language);
    
    res.json({
      success: true,
      quality: assessment.quality,
      confidence: assessment.confidence,
      feedback: assessment.feedback,
      suggestions: assessment.suggestions
    });
  } catch (error) {
    console.error('Answer assessment error:', error);
    res.status(500).json({ error: 'Failed to assess answer quality' });
  }
});

// Model status endpoint
app.get('/api/models/status', async (req, res) => {
  try {
    const status = {
      models: {
        'IndicSBERT': await ragPipeline.isModelLoaded('IndicSBERT'),
        'Vosk': await transcriptionService.isModelLoaded('Vosk'),
        'Whisper': await transcriptionService.isModelLoaded('Whisper'),
        'gTTS': await ttsService.isServiceAvailable('gTTS')
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Model status error:', error);
    res.status(500).json({ error: 'Failed to get model status' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('AI service error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`AI service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
