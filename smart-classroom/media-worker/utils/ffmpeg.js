const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

class FFmpegUtils {
  constructor() {
    this.ffmpegPath = ffmpegStatic;
  }

  // Get video metadata
  async getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  // Get audio metadata
  async getAudioMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  // Check if file is a valid video
  async isValidVideo(filePath) {
    try {
      const metadata = await this.getVideoMetadata(filePath);
      return metadata.streams.some(stream => stream.codec_type === 'video');
    } catch (error) {
      return false;
    }
  }

  // Check if file is a valid audio
  async isValidAudio(filePath) {
    try {
      const metadata = await this.getAudioMetadata(filePath);
      return metadata.streams.some(stream => stream.codec_type === 'audio');
    } catch (error) {
      return false;
    }
  }

  // Get video duration in seconds
  async getDuration(filePath) {
    try {
      const metadata = await this.getVideoMetadata(filePath);
      return parseFloat(metadata.format.duration);
    } catch (error) {
      throw new Error(`Failed to get duration: ${error.message}`);
    }
  }

  // Get video resolution
  async getResolution(filePath) {
    try {
      const metadata = await this.getVideoMetadata(filePath);
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      
      if (!videoStream) {
        throw new Error('No video stream found');
      }

      return {
        width: videoStream.width,
        height: videoStream.height,
        aspectRatio: videoStream.display_aspect_ratio || `${videoStream.width}:${videoStream.height}`
      };
    } catch (error) {
      throw new Error(`Failed to get resolution: ${error.message}`);
    }
  }

  // Get video bitrate
  async getBitrate(filePath) {
    try {
      const metadata = await this.getVideoMetadata(filePath);
      return parseInt(metadata.format.bit_rate) || 0;
    } catch (error) {
      throw new Error(`Failed to get bitrate: ${error.message}`);
    }
  }

  // Get audio information
  async getAudioInfo(filePath) {
    try {
      const metadata = await this.getVideoMetadata(filePath);
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
      
      if (!audioStream) {
        return null;
      }

      return {
        codec: audioStream.codec_name,
        sampleRate: audioStream.sample_rate,
        channels: audioStream.channels,
        bitrate: audioStream.bit_rate
      };
    } catch (error) {
      throw new Error(`Failed to get audio info: ${error.message}`);
    }
  }

  // Convert seconds to time string (HH:MM:SS)
  secondsToTimeString(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Convert time string to seconds
  timeStringToSeconds(timeString) {
    const parts = timeString.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid time format. Use HH:MM:SS');
    }

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);

    return hours * 3600 + minutes * 60 + seconds;
  }

  // Get optimal settings for low bandwidth
  getLowBandwidthSettings() {
    return {
      video: {
        codec: 'libx264',
        preset: 'ultrafast',
        crf: 28,
        maxrate: '600k',
        bufsize: '1200k',
        profile: 'baseline',
        level: '3.0',
        size: '854x480'
      },
      audio: {
        codec: 'aac',
        bitrate: '64k',
        channels: 2,
        sampleRate: 44100
      },
      container: {
        format: 'mp4',
        movflags: 'faststart'
      }
    };
  }

  // Get optimal settings for medium bandwidth
  getMediumBandwidthSettings() {
    return {
      video: {
        codec: 'libx264',
        preset: 'fast',
        crf: 23,
        maxrate: '1200k',
        bufsize: '2400k',
        profile: 'main',
        level: '3.1',
        size: '1280x720'
      },
      audio: {
        codec: 'aac',
        bitrate: '128k',
        channels: 2,
        sampleRate: 44100
      },
      container: {
        format: 'mp4',
        movflags: 'faststart'
      }
    };
  }

  // Get optimal settings for high bandwidth
  getHighBandwidthSettings() {
    return {
      video: {
        codec: 'libx264',
        preset: 'medium',
        crf: 18,
        maxrate: '2500k',
        bufsize: '5000k',
        profile: 'high',
        level: '4.0',
        size: '1920x1080'
      },
      audio: {
        codec: 'aac',
        bitrate: '192k',
        channels: 2,
        sampleRate: 44100
      },
      container: {
        format: 'mp4',
        movflags: 'faststart'
      }
    };
  }

  // Validate input file
  async validateInput(inputPath) {
    const errors = [];
    
    try {
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(inputPath)) {
        errors.push('File does not exist');
        return { valid: false, errors };
      }

      // Check if it's a valid media file
      const isVideo = await this.isValidVideo(inputPath);
      const isAudio = await this.isValidAudio(inputPath);
      
      if (!isVideo && !isAudio) {
        errors.push('File is not a valid video or audio file');
      }

      // Get basic metadata
      const metadata = await this.getVideoMetadata(inputPath);
      const duration = parseFloat(metadata.format.duration);
      
      if (duration > 0) {
        // Check file size (max 2GB)
        const fileSize = parseInt(metadata.format.size);
        if (fileSize > 2 * 1024 * 1024 * 1024) {
          errors.push('File size exceeds 2GB limit');
        }
      } else {
        errors.push('Invalid or corrupted media file');
      }

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Create FFmpeg command with error handling
  createCommand(inputPath) {
    const command = ffmpeg(inputPath);
    
    // Add error handling
    command.on('error', (err) => {
      console.error('FFmpeg error:', err);
    });

    return command;
  }

  // Get supported formats
  getSupportedFormats() {
    return {
      input: {
        video: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v'],
        audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma']
      },
      output: {
        video: ['mp4', 'webm', 'avi'],
        audio: ['mp3', 'aac', 'wav', 'ogg']
      }
    };
  }
}

module.exports = new FFmpegUtils();
