const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const transcodeJob = {
  async process(job) {
    const { inputPath, outputPath, options = {} } = job.data;
    
    try {
      console.log(`Starting transcode job ${job.id}: ${inputPath} -> ${outputPath}`);
      
      // Update job progress
      job.progress(10);
      
      // Check if input file exists
      if (!await fs.pathExists(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }
      
      // Create output directory if it doesn't exist
      await fs.ensureDir(path.dirname(outputPath));
      
      job.progress(20);
      
      // Default transcoding options for low bandwidth
      const defaultOptions = {
        // Video settings for low bandwidth
        videoCodec: 'libx264',
        videoBitrate: '500k',
        videoPreset: 'ultrafast',
        videoCrf: 28,
        maxrate: '600k',
        bufsize: '1200k',
        videoSize: '854x480', // 480p for better compatibility
        
        // Audio settings
        audioCodec: 'aac',
        audioBitrate: '64k',
        audioChannels: 2,
        audioFrequency: 44100,
        
        // Container format
        format: 'mp4',
        
        // Additional options
        movflags: 'faststart', // Enable fast start for web streaming
        profile: 'baseline', // H.264 baseline profile for better compatibility
        level: '3.0'
      };
      
      // Merge with provided options
      const transcodeOptions = { ...defaultOptions, ...options };
      
      job.progress(30);
      
      // Create FFmpeg command
      const command = ffmpeg(inputPath)
        .videoCodec(transcodeOptions.videoCodec)
        .videoBitrate(transcodeOptions.videoBitrate)
        .addOption('-preset', transcodeOptions.videoPreset)
        .addOption('-crf', transcodeOptions.videoCrf)
        .addOption('-maxrate', transcodeOptions.maxrate)
        .addOption('-bufsize', transcodeOptions.bufsize)
        .size(transcodeOptions.videoSize)
        .audioCodec(transcodeOptions.audioCodec)
        .audioBitrate(transcodeOptions.audioBitrate)
        .audioChannels(transcodeOptions.audioChannels)
        .audioFrequency(transcodeOptions.audioFrequency)
        .format(transcodeOptions.format)
        .addOption('-movflags', transcodeOptions.movflags)
        .addOption('-profile:v', transcodeOptions.profile)
        .addOption('-level', transcodeOptions.level);
      
      // Add additional options if provided
      if (transcodeOptions.additionalOptions) {
        transcodeOptions.additionalOptions.forEach(option => {
          command.addOption(option);
        });
      }
      
      job.progress(40);
      
      // Execute transcoding
      await new Promise((resolve, reject) => {
        command
          .on('start', (commandLine) => {
            console.log(`FFmpeg command: ${commandLine}`);
          })
          .on('progress', (progress) => {
            // Update job progress (40% to 90%)
            const progressPercent = 40 + (progress.percent || 0) * 0.5;
            job.progress(Math.min(progressPercent, 90));
          })
          .on('end', () => {
            console.log('Transcoding completed successfully');
            resolve();
          })
          .on('error', (err) => {
            console.error('Transcoding error:', err);
            reject(err);
          })
          .save(outputPath);
      });
      
      job.progress(95);
      
      // Verify output file
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Output file was not created');
      }
      
      // Get file stats
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      job.progress(100);
      
      console.log(`Transcode job ${job.id} completed successfully`);
      
      return {
        success: true,
        outputPath,
        fileSize,
        duration: await getVideoDuration(outputPath),
        options: transcodeOptions
      };
      
    } catch (error) {
      console.error(`Transcode job ${job.id} failed:`, error);
      throw error;
    }
  }
};

// Helper function to get video duration
async function getVideoDuration(filePath) {
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

// Generate HLS playlist for adaptive streaming
transcodeJob.generateHLS = async (inputPath, outputDir, options = {}) => {
  const playlistName = options.playlistName || 'playlist.m3u8';
  const segmentDuration = options.segmentDuration || 10;
  const hlsTime = options.hlsTime || segmentDuration;
  
  // Create output directory
  await fs.ensureDir(outputDir);
  
  const outputPath = path.join(outputDir, playlistName);
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .addOption('-f', 'hls')
      .addOption('-hls_time', hlsTime)
      .addOption('-hls_playlist_type', 'vod')
      .addOption('-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'))
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
};

// Generate multiple quality versions for adaptive streaming
transcodeJob.generateAdaptiveStream = async (inputPath, outputDir, qualities = []) => {
  const defaultQualities = [
    { name: '360p', size: '640x360', bitrate: '500k' },
    { name: '480p', size: '854x480', bitrate: '800k' },
    { name: '720p', size: '1280x720', bitrate: '1500k' }
  ];
  
  const streamQualities = qualities.length > 0 ? qualities : defaultQualities;
  const masterPlaylist = path.join(outputDir, 'master.m3u8');
  
  await fs.ensureDir(outputDir);
  
  // Generate individual quality playlists
  const qualityPlaylists = [];
  
  for (const quality of streamQualities) {
    const qualityDir = path.join(outputDir, quality.name);
    await fs.ensureDir(qualityDir);
    
    const playlistPath = await transcodeJob.generateHLS(inputPath, qualityDir, {
      playlistName: 'playlist.m3u8',
      segmentDuration: 10
    });
    
    qualityPlaylists.push({
      name: quality.name,
      path: playlistPath,
      bandwidth: quality.bitrate,
      resolution: quality.size
    });
  }
  
  // Generate master playlist
  let masterPlaylistContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
  
  for (const quality of qualityPlaylists) {
    masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${quality.bandwidth.replace('k', '000')},RESOLUTION=${quality.resolution}\n`;
    masterPlaylistContent += `${quality.name}/playlist.m3u8\n\n`;
  }
  
  await fs.writeFile(masterPlaylist, masterPlaylistContent);
  
  return {
    masterPlaylist,
    qualities: qualityPlaylists
  };
};

module.exports = transcodeJob;
