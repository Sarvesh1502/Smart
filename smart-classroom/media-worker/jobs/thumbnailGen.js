const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const thumbnailGenJob = {
  async process(job) {
    const { inputPath, outputPath, options = {} } = job.data;
    
    try {
      console.log(`Starting thumbnail generation job ${job.id}: ${inputPath} -> ${outputPath}`);
      
      // Update job progress
      job.progress(10);
      
      // Check if input file exists
      if (!await fs.pathExists(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }
      
      // Create output directory if it doesn't exist
      await fs.ensureDir(path.dirname(outputPath));
      
      job.progress(20);
      
      // Default thumbnail options
      const defaultOptions = {
        timeOffset: '00:00:05', // Extract thumbnail at 5 seconds
        width: 320,
        height: 180,
        quality: 80,
        format: 'jpeg',
        count: 1 // Number of thumbnails to generate
      };
      
      // Merge with provided options
      const thumbnailOptions = { ...defaultOptions, ...options };
      
      job.progress(30);
      
      // Generate single thumbnail
      if (thumbnailOptions.count === 1) {
        await generateSingleThumbnail(inputPath, outputPath, thumbnailOptions);
      } else {
        // Generate multiple thumbnails
        await generateMultipleThumbnails(inputPath, outputPath, thumbnailOptions);
      }
      
      job.progress(90);
      
      // Verify output file(s)
      if (thumbnailOptions.count === 1) {
        if (!await fs.pathExists(outputPath)) {
          throw new Error('Output thumbnail file was not created');
        }
      } else {
        // Check if at least one thumbnail was created
        const outputDir = path.dirname(outputPath);
        const files = await fs.readdir(outputDir);
        const thumbnailFiles = files.filter(file => 
          file.startsWith(path.basename(outputPath, path.extname(outputPath)))
        );
        
        if (thumbnailFiles.length === 0) {
          throw new Error('No thumbnail files were created');
        }
      }
      
      job.progress(100);
      
      console.log(`Thumbnail generation job ${job.id} completed successfully`);
      
      return {
        success: true,
        outputPath,
        options: thumbnailOptions
      };
      
    } catch (error) {
      console.error(`Thumbnail generation job ${job.id} failed:`, error);
      throw error;
    }
  }
};

// Generate single thumbnail
async function generateSingleThumbnail(inputPath, outputPath, options) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(options.timeOffset)
      .frames(1)
      .size(`${options.width}x${options.height}`)
      .format('image2')
      .on('start', (commandLine) => {
        console.log(`FFmpeg thumbnail command: ${commandLine}`);
      })
      .on('end', async () => {
        try {
          // Process with Sharp for better quality and compression
          await sharp(outputPath)
            .resize(options.width, options.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: options.quality })
            .toFile(outputPath);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject)
      .save(outputPath);
  });
}

// Generate multiple thumbnails
async function generateMultipleThumbnails(inputPath, outputPath, options) {
  const outputDir = path.dirname(outputPath);
  const baseName = path.basename(outputPath, path.extname(outputPath));
  const extension = path.extname(outputPath);
  
  // Get video duration first
  const duration = await getVideoDuration(inputPath);
  const interval = duration / options.count;
  
  const thumbnails = [];
  
  for (let i = 0; i < options.count; i++) {
    const timeOffset = i * interval;
    const timeString = secondsToTimeString(timeOffset);
    const thumbnailPath = path.join(outputDir, `${baseName}_${i.toString().padStart(3, '0')}${extension}`);
    
    try {
      await generateSingleThumbnail(inputPath, thumbnailPath, {
        ...options,
        timeOffset: timeString
      });
      
      thumbnails.push({
        index: i,
        path: thumbnailPath,
        timeOffset: timeOffset
      });
    } catch (error) {
      console.error(`Failed to generate thumbnail ${i}:`, error);
    }
  }
  
  return thumbnails;
}

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

// Helper function to convert seconds to time string
function secondsToTimeString(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Generate thumbnail grid (sprite sheet)
thumbnailGenJob.generateThumbnailGrid = async (inputPath, outputPath, options = {}) => {
  const defaultOptions = {
    gridSize: 5, // 5x5 grid
    thumbnailSize: 160,
    quality: 80,
    format: 'jpeg'
  };
  
  const gridOptions = { ...defaultOptions, ...options };
  const totalThumbnails = gridOptions.gridSize * gridOptions.gridSize;
  
  // Get video duration
  const duration = await getVideoDuration(inputPath);
  const interval = duration / totalThumbnails;
  
  // Generate individual thumbnails
  const tempDir = path.join(path.dirname(outputPath), 'temp_thumbnails');
  await fs.ensureDir(tempDir);
  
  const thumbnails = [];
  
  for (let i = 0; i < totalThumbnails; i++) {
    const timeOffset = i * interval;
    const timeString = secondsToTimeString(timeOffset);
    const thumbnailPath = path.join(tempDir, `thumb_${i.toString().padStart(3, '0')}.jpg`);
    
    try {
      await generateSingleThumbnail(inputPath, thumbnailPath, {
        timeOffset: timeString,
        width: gridOptions.thumbnailSize,
        height: gridOptions.thumbnailSize,
        quality: gridOptions.quality,
        format: gridOptions.format
      });
      
      thumbnails.push(thumbnailPath);
    } catch (error) {
      console.error(`Failed to generate thumbnail ${i}:`, error);
    }
  }
  
  // Create grid using Sharp
  const gridWidth = gridOptions.gridSize * gridOptions.thumbnailSize;
  const gridHeight = gridOptions.gridSize * gridOptions.thumbnailSize;
  
  const grid = sharp({
    create: {
      width: gridWidth,
      height: gridHeight,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    }
  });
  
  // Composite all thumbnails into grid
  const composite = [];
  for (let i = 0; i < thumbnails.length; i++) {
    const row = Math.floor(i / gridOptions.gridSize);
    const col = i % gridOptions.gridSize;
    
    composite.push({
      input: thumbnails[i],
      left: col * gridOptions.thumbnailSize,
      top: row * gridOptions.thumbnailSize
    });
  }
  
  await grid
    .composite(composite)
    .jpeg({ quality: gridOptions.quality })
    .toFile(outputPath);
  
  // Clean up temporary files
  await fs.remove(tempDir);
  
  return {
    outputPath,
    gridSize: gridOptions.gridSize,
    thumbnailCount: thumbnails.length,
    totalDuration: duration
  };
};

// Generate animated GIF thumbnail
thumbnailGenJob.generateAnimatedThumbnail = async (inputPath, outputPath, options = {}) => {
  const defaultOptions = {
    startTime: '00:00:00',
    duration: 3, // 3 seconds
    fps: 10,
    width: 320,
    height: 180,
    quality: 80
  };
  
  const gifOptions = { ...defaultOptions, ...options };
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(gifOptions.startTime)
      .duration(gifOptions.duration)
      .fps(gifOptions.fps)
      .size(`${gifOptions.width}x${gifOptions.height}`)
      .format('gif')
      .on('start', (commandLine) => {
        console.log(`FFmpeg animated GIF command: ${commandLine}`);
      })
      .on('end', () => {
        console.log('Animated GIF thumbnail generated successfully');
        resolve();
      })
      .on('error', reject)
      .save(outputPath);
  });
};

module.exports = thumbnailGenJob;
