const vosk = require('vosk');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { HfInference } = require('@huggingface/inference');

class TranscriptionService {
  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.models = {
      vosk: null,
      whisper: 'openai/whisper-base'
    };
    this.loadedModels = new Map();
    this.initializeModels();
  }

  async initializeModels() {
    try {
      console.log('Initializing transcription models...');
      
      // Initialize Vosk model
      await this.initializeVosk();
      
      console.log('Transcription models initialized successfully');
    } catch (error) {
      console.error('Error initializing transcription models:', error);
    }
  }

  async initializeVosk() {
    try {
      const modelPath = process.env.VOSK_MODEL_PATH || './models/vosk-model-en-us-0.22';
      
      if (await fs.pathExists(modelPath)) {
        this.models.vosk = new vosk.Model(modelPath);
        this.loadedModels.set('Vosk', true);
        console.log('Vosk model loaded successfully');
      } else {
        console.log('Vosk model not found, using Whisper as fallback');
      }
    } catch (error) {
      console.error('Error initializing Vosk model:', error);
    }
  }

  async isModelLoaded(modelName) {
    return this.loadedModels.has(modelName);
  }

  // Transcribe audio file
  async transcribeAudio(audioUrl, language = 'en', format = 'mp3') {
    try {
      console.log(`Transcribing audio: ${audioUrl} (${language})`);
      
      // Download audio file
      const audioPath = await this.downloadAudio(audioUrl);
      
      // Convert to WAV if needed
      const wavPath = await this.convertToWav(audioPath, format);
      
      // Choose transcription method
      let transcription;
      if (this.models.vosk && language === 'en') {
        transcription = await this.transcribeWithVosk(wavPath);
      } else {
        transcription = await this.transcribeWithWhisper(wavPath, language);
      }
      
      // Clean up temporary files
      await this.cleanup([audioPath, wavPath]);
      
      return transcription;
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw error;
    }
  }

  // Transcribe video file
  async transcribeVideo(videoUrl, language = 'en') {
    try {
      console.log(`Transcribing video: ${videoUrl} (${language})`);
      
      // Extract audio from video
      const audioPath = await this.extractAudioFromVideo(videoUrl);
      
      // Transcribe the extracted audio
      const transcription = await this.transcribeAudio(audioPath, language, 'wav');
      
      // Clean up temporary files
      await this.cleanup([audioPath]);
      
      return transcription;
    } catch (error) {
      console.error('Video transcription error:', error);
      throw error;
    }
  }

  // Download audio file
  async downloadAudio(audioUrl) {
    const axios = require('axios');
    const tempPath = path.join(__dirname, 'temp', `audio_${Date.now()}.tmp`);
    
    await fs.ensureDir(path.dirname(tempPath));
    
    const response = await axios({
      method: 'GET',
      url: audioUrl,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(tempPath));
      writer.on('error', reject);
    });
  }

  // Convert audio to WAV format
  async convertToWav(inputPath, inputFormat) {
    const outputPath = inputPath.replace(/\.[^/.]+$/, '.wav');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .save(outputPath);
    });
  }

  // Extract audio from video
  async extractAudioFromVideo(videoUrl) {
    const axios = require('axios');
    const tempPath = path.join(__dirname, 'temp', `video_${Date.now()}.tmp`);
    const audioPath = tempPath.replace(/\.[^/.]+$/, '.wav');
    
    await fs.ensureDir(path.dirname(tempPath));
    
    // Download video
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    // Extract audio
    return new Promise((resolve, reject) => {
      ffmpeg(tempPath)
        .noVideo()
        .toFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', () => {
          fs.remove(tempPath).then(() => resolve(audioPath));
        })
        .on('error', reject)
        .save(audioPath);
    });
  }

  // Transcribe with Vosk
  async transcribeWithVosk(audioPath) {
    return new Promise((resolve, reject) => {
      const rec = new vosk.Recognizer(this.models.vosk, 16000);
      const stream = fs.createReadStream(audioPath);
      
      let finalResult = '';
      let confidence = 0;
      
      stream.on('data', (chunk) => {
        if (rec.acceptWaveform(chunk)) {
          const result = JSON.parse(rec.result());
          if (result.text) {
            finalResult += result.text + ' ';
            confidence = Math.max(confidence, result.confidence || 0.8);
          }
        }
      });
      
      stream.on('end', () => {
        const result = JSON.parse(rec.finalResult());
        if (result.text) {
          finalResult += result.text;
          confidence = Math.max(confidence, result.confidence || 0.8);
        }
        
        rec.free();
        
        resolve({
          text: finalResult.trim(),
          confidence: confidence,
          language: 'en',
          segments: this.createSegments(finalResult.trim())
        });
      });
      
      stream.on('error', (error) => {
        rec.free();
        reject(error);
      });
    });
  }

  // Transcribe with Whisper
  async transcribeWithWhisper(audioPath, language = 'en') {
    try {
      const audioBuffer = await fs.readFile(audioPath);
      
      const transcription = await this.hf.automaticSpeechRecognition({
        model: this.models.whisper,
        data: audioBuffer,
        language: language
      });
      
      return {
        text: transcription.text,
        confidence: 0.9, // Whisper doesn't provide confidence scores
        language: language,
        segments: this.createSegments(transcription.text)
      };
    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw error;
    }
  }

  // Create segments from transcription text
  createSegments(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segments = [];
    
    sentences.forEach((sentence, index) => {
      segments.push({
        start: index * 5, // Approximate timing
        end: (index + 1) * 5,
        text: sentence.trim()
      });
    });
    
    return segments;
  }

  // Clean up temporary files
  async cleanup(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        }
      } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
      }
    }
  }

  // Transcribe with speaker diarization
  async transcribeWithSpeakerDiarization(audioPath, language = 'en') {
    try {
      // This would require additional speaker diarization models
      // For now, return basic transcription
      const transcription = await this.transcribeAudio(audioPath, language);
      
      // Add speaker labels (simplified)
      const segments = transcription.segments.map((segment, index) => ({
        ...segment,
        speaker: `Speaker ${(index % 2) + 1}` // Simple alternating speakers
      }));
      
      return {
        ...transcription,
        segments: segments
      };
    } catch (error) {
      console.error('Speaker diarization error:', error);
      throw error;
    }
  }

  // Transcribe with timestamps
  async transcribeWithTimestamps(audioPath, language = 'en') {
    try {
      const transcription = await this.transcribeAudio(audioPath, language);
      
      // Add more accurate timestamps
      const duration = await this.getAudioDuration(audioPath);
      const segments = transcription.segments.map((segment, index) => {
        const segmentDuration = duration / transcription.segments.length;
        return {
          ...segment,
          start: index * segmentDuration,
          end: (index + 1) * segmentDuration
        };
      });
      
      return {
        ...transcription,
        segments: segments
      };
    } catch (error) {
      console.error('Timestamp transcription error:', error);
      throw error;
    }
  }

  // Get audio duration
  async getAudioDuration(audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(parseFloat(metadata.format.duration));
        }
      });
    });
  }
}

module.exports = new TranscriptionService();
