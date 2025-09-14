const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const audioExtractJob = {
  async process(job) {
    const { inputPath, outputPath, options = {} } = job.data;
    
    try {
      console.log(`Starting audio extraction job ${job.id}: ${inputPath} -> ${outputPath}`);
      
      // Update job progress
      job.progress(10);
      
      // Check if input file exists
      if (!await fs.pathExists(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }
      
      // Create output directory if it doesn't exist
      await fs.ensureDir(path.dirname(outputPath));
      
      job.progress(20);
      
      // Default audio extraction options
      const defaultOptions = {
        audioCodec: 'mp3',
        audioBitrate: '128k',
        audioChannels: 2,
        audioFrequency: 44100,
        format: 'mp3'
      };
      
      // Merge with provided options
      const extractOptions = { ...defaultOptions, ...options };
      
      job.progress(30);
      
      // Create FFmpeg command for audio extraction
      const command = ffmpeg(inputPath)
        .noVideo() // Remove video stream
        .audioCodec(extractOptions.audioCodec)
        .audioBitrate(extractOptions.audioBitrate)
        .audioChannels(extractOptions.audioChannels)
        .audioFrequency(extractOptions.audioFrequency)
        .format(extractOptions.format);
      
      // Add additional options if provided
      if (extractOptions.additionalOptions) {
        extractOptions.additionalOptions.forEach(option => {
          command.addOption(option);
        });
      }
      
      job.progress(40);
      
      // Execute audio extraction
      await new Promise((resolve, reject) => {
        command
          .on('start', (commandLine) => {
            console.log(`FFmpeg audio extraction command: ${commandLine}`);
          })
          .on('progress', (progress) => {
            // Update job progress (40% to 90%)
            const progressPercent = 40 + (progress.percent || 0) * 0.5;
            job.progress(Math.min(progressPercent, 90));
          })
          .on('end', () => {
            console.log('Audio extraction completed successfully');
            resolve();
          })
          .on('error', (err) => {
            console.error('Audio extraction error:', err);
            reject(err);
          })
          .save(outputPath);
      });
      
      job.progress(95);
      
      // Verify output file
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Output audio file was not created');
      }
      
      // Get file stats
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      job.progress(100);
      
      console.log(`Audio extraction job ${job.id} completed successfully`);
      
      return {
        success: true,
        outputPath,
        fileSize,
        duration: await getAudioDuration(outputPath),
        options: extractOptions
      };
      
    } catch (error) {
      console.error(`Audio extraction job ${job.id} failed:`, error);
      throw error;
    }
  }
};

// Helper function to get audio duration
async function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration);
      }
    });
  });
}

// Extract audio with different quality options
audioExtractJob.extractMultipleQualities = async (inputPath, outputDir, qualities = []) => {
  const defaultQualities = [
    { name: 'low', bitrate: '64k', format: 'mp3' },
    { name: 'medium', bitrate: '128k', format: 'mp3' },
    { name: 'high', bitrate: '256k', format: 'mp3' }
  ];
  
  const audioQualities = qualities.length > 0 ? qualities : defaultQualities;
  const results = [];
  
  await fs.ensureDir(outputDir);
  
  for (const quality of audioQualities) {
    const outputPath = path.join(outputDir, `audio_${quality.name}.${quality.format}`);
    
    try {
      const result = await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .noVideo()
          .audioCodec(quality.format === 'mp3' ? 'libmp3lame' : 'aac')
          .audioBitrate(quality.bitrate)
          .audioChannels(2)
          .audioFrequency(44100)
          .format(quality.format)
          .on('end', () => resolve({ success: true, outputPath }))
          .on('error', reject)
          .save(outputPath);
      });
      
      results.push({
        quality: quality.name,
        ...result,
        bitrate: quality.bitrate,
        format: quality.format
      });
    } catch (error) {
      console.error(`Failed to extract ${quality.name} quality audio:`, error);
      results.push({
        quality: quality.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Extract audio segments (for transcription)
audioExtractJob.extractSegments = async (inputPath, outputDir, segmentDuration = 30) => {
  await fs.ensureDir(outputDir);
  
  // First get the total duration
  const duration = await getAudioDuration(inputPath);
  const segments = [];
  
  let currentTime = 0;
  let segmentIndex = 0;
  
  while (currentTime < duration) {
    const segmentPath = path.join(outputDir, `segment_${segmentIndex.toString().padStart(3, '0')}.mp3`);
    
    try {
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(currentTime)
          .duration(segmentDuration)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .audioChannels(1) // Mono for transcription
          .audioFrequency(16000) // 16kHz for speech recognition
          .format('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(segmentPath);
      });
      
      segments.push({
        index: segmentIndex,
        path: segmentPath,
        startTime: currentTime,
        endTime: Math.min(currentTime + segmentDuration, duration),
        duration: Math.min(segmentDuration, duration - currentTime)
      });
      
      segmentIndex++;
      currentTime += segmentDuration;
    } catch (error) {
      console.error(`Failed to extract segment ${segmentIndex}:`, error);
      break;
    }
  }
  
  return segments;
};

// Convert audio format
audioExtractJob.convertFormat = async (inputPath, outputPath, targetFormat, options = {}) => {
  const defaultOptions = {
    audioCodec: targetFormat === 'mp3' ? 'libmp3lame' : 'aac',
    audioBitrate: '128k',
    audioChannels: 2,
    audioFrequency: 44100
  };
  
  const convertOptions = { ...defaultOptions, ...options };
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec(convertOptions.audioCodec)
      .audioBitrate(convertOptions.audioBitrate)
      .audioChannels(convertOptions.audioChannels)
      .audioFrequency(convertOptions.audioFrequency)
      .format(targetFormat)
      .on('end', () => resolve({ success: true, outputPath }))
      .on('error', reject)
      .save(outputPath);
  });
};

module.exports = audioExtractJob;
