const gTTS = require('gtts');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

class TTSService {
  constructor() {
    this.supportedLanguages = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'bn': 'Bengali',
      'gu': 'Gujarati',
      'mr': 'Marathi',
      'pa': 'Punjabi',
      'or': 'Odia',
      'as': 'Assamese'
    };
    this.voiceSettings = {
      'en': { speed: 1.0, pitch: 1.0 },
      'hi': { speed: 0.9, pitch: 1.0 },
      'ta': { speed: 0.9, pitch: 1.0 },
      'te': { speed: 0.9, pitch: 1.0 },
      'bn': { speed: 0.9, pitch: 1.0 },
      'gu': { speed: 0.9, pitch: 1.0 },
      'mr': { speed: 0.9, pitch: 1.0 },
      'pa': { speed: 0.9, pitch: 1.0 },
      'or': { speed: 0.9, pitch: 1.0 },
      'as': { speed: 0.9, pitch: 1.0 }
    };
  }

  async isServiceAvailable(serviceName) {
    return true; // Simplified check
  }

  // Generate speech from text
  async generateSpeech(text, language = 'en', voice = 'default') {
    try {
      console.log(`Generating speech for: ${text.substring(0, 50)}... (${language})`);
      
      // Validate language
      if (!this.supportedLanguages[language]) {
        throw new Error(`Unsupported language: ${language}`);
      }
      
      // Clean text
      const cleanText = this.cleanText(text);
      
      // Generate audio using gTTS
      const audioBuffer = await this.generateWithGTTS(cleanText, language);
      
      // Save audio file
      const audioPath = await this.saveAudioFile(audioBuffer, language);
      
      // Get audio duration
      const duration = await this.getAudioDuration(audioPath);
      
      return {
        audioUrl: audioPath,
        duration: duration,
        language: language,
        voice: voice,
        text: cleanText
      };
    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    }
  }

  // Generate speech with gTTS
  async generateWithGTTS(text, language) {
    return new Promise((resolve, reject) => {
      try {
        const gtts = new gTTS(text, language);
        const audioBuffer = [];
        
        gtts.on('data', (chunk) => {
          audioBuffer.push(chunk);
        });
        
        gtts.on('end', () => {
          resolve(Buffer.concat(audioBuffer));
        });
        
        gtts.on('error', (error) => {
          reject(error);
        });
        
        gtts.stream();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Save audio file
  async saveAudioFile(audioBuffer, language) {
    const outputDir = path.join(__dirname, 'output', 'tts');
    await fs.ensureDir(outputDir);
    
    const filename = `tts_${Date.now()}_${language}.mp3`;
    const filePath = path.join(outputDir, filename);
    
    await fs.writeFile(filePath, audioBuffer);
    
    return filePath;
  }

  // Clean text for TTS
  cleanText(text) {
    // Remove HTML tags
    let clean = text.replace(/<[^>]*>/g, '');
    
    // Remove special characters that might cause issues
    clean = clean.replace(/[^\w\s.,!?;:'"()-]/g, ' ');
    
    // Normalize whitespace
    clean = clean.replace(/\s+/g, ' ').trim();
    
    // Limit length for TTS (most services have limits)
    if (clean.length > 5000) {
      clean = clean.substring(0, 5000) + '...';
    }
    
    return clean;
  }

  // Get audio duration
  async getAudioDuration(audioPath) {
    try {
      const ffmpeg = require('fluent-ffmpeg');
      
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(parseFloat(metadata.format.duration));
          }
        });
      });
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
    }
  }

  // Generate speech with custom settings
  async generateSpeechWithSettings(text, language = 'en', settings = {}) {
    try {
      const defaultSettings = this.voiceSettings[language] || this.voiceSettings['en'];
      const finalSettings = { ...defaultSettings, ...settings };
      
      // For now, we'll use the basic gTTS generation
      // In a more advanced implementation, you could use services that support
      // custom voice settings like Azure Speech or AWS Polly
      
      const result = await this.generateSpeech(text, language);
      
      return {
        ...result,
        settings: finalSettings
      };
    } catch (error) {
      console.error('Custom TTS generation error:', error);
      throw error;
    }
  }

  // Generate speech for multiple languages
  async generateMultilingualSpeech(text, languages = ['en']) {
    try {
      const results = [];
      
      for (const language of languages) {
        try {
          const result = await this.generateSpeech(text, language);
          results.push(result);
        } catch (error) {
          console.error(`Error generating speech for ${language}:`, error);
          results.push({
            language: language,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Multilingual TTS error:', error);
      throw error;
    }
  }

  // Generate speech with SSML (Speech Synthesis Markup Language)
  async generateSpeechWithSSML(ssmlText, language = 'en') {
    try {
      // Extract plain text from SSML
      const plainText = this.extractTextFromSSML(ssmlText);
      
      // Generate speech with the plain text
      const result = await this.generateSpeech(plainText, language);
      
      return {
        ...result,
        ssml: ssmlText,
        processedText: plainText
      };
    } catch (error) {
      console.error('SSML TTS error:', error);
      throw error;
    }
  }

  // Extract text from SSML
  extractTextFromSSML(ssmlText) {
    // Remove SSML tags and extract plain text
    let text = ssmlText.replace(/<[^>]*>/g, '');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  // Generate speech with emotion/expression
  async generateEmotionalSpeech(text, language = 'en', emotion = 'neutral') {
    try {
      // Map emotions to text modifications
      const emotionModifications = {
        'happy': '!',
        'sad': '.',
        'excited': '!',
        'calm': '.',
        'urgent': '!',
        'neutral': '.'
      };
      
      const modification = emotionModifications[emotion] || '.';
      const modifiedText = text.endsWith('.') ? text : text + modification;
      
      const result = await this.generateSpeech(modifiedText, language);
      
      return {
        ...result,
        emotion: emotion,
        originalText: text,
        modifiedText: modifiedText
      };
    } catch (error) {
      console.error('Emotional TTS error:', error);
      throw error;
    }
  }

  // Batch generate speech for multiple texts
  async batchGenerateSpeech(texts, language = 'en') {
    try {
      const results = [];
      
      for (let i = 0; i < texts.length; i++) {
        try {
          const result = await this.generateSpeech(texts[i], language);
          results.push({
            index: i,
            text: texts[i],
            ...result
          });
        } catch (error) {
          console.error(`Error generating speech for text ${i}:`, error);
          results.push({
            index: i,
            text: texts[i],
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch TTS error:', error);
      throw error;
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Get voice settings for a language
  getVoiceSettings(language) {
    return this.voiceSettings[language] || this.voiceSettings['en'];
  }

  // Validate text for TTS
  validateText(text) {
    const issues = [];
    
    if (!text || text.trim().length === 0) {
      issues.push('Text is empty');
    }
    
    if (text.length > 5000) {
      issues.push('Text is too long (max 5000 characters)');
    }
    
    // Check for problematic characters
    const problematicChars = /[<>{}[\]\\|`~]/;
    if (problematicChars.test(text)) {
      issues.push('Text contains problematic characters');
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }
}

module.exports = new TTSService();
