const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Bull = require('bull');
const Redis = require('redis');
require('dotenv').config();

// Import job processors
const transcodeJob = require('./jobs/transcode');
const audioExtractJob = require('./jobs/audioExtract');
const thumbnailGenJob = require('./jobs/thumbnailGen');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Redis connection
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.connect().then(() => {
  console.log('Connected to Redis');
}).catch(err => {
  console.error('Failed to connect to Redis:', err);
});

// Create job queues
const transcodeQueue = new Bull('transcode', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

const audioExtractQueue = new Bull('audio-extract', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

const thumbnailQueue = new Bull('thumbnail', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Process jobs
transcodeQueue.process('transcode-video', transcodeJob.process);
audioExtractQueue.process('extract-audio', audioExtractJob.process);
thumbnailQueue.process('generate-thumbnail', thumbnailGenJob.process);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Media Worker',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    queues: {
      transcode: transcodeQueue.getJobCounts(),
      audioExtract: audioExtractQueue.getJobCounts(),
      thumbnail: thumbnailQueue.getJobCounts()
    }
  });
});

// Add transcode job
app.post('/jobs/transcode', async (req, res) => {
  try {
    const { inputPath, outputPath, options = {} } = req.body;
    
    if (!inputPath || !outputPath) {
      return res.status(400).json({ 
        error: 'inputPath and outputPath are required' 
      });
    }

    const job = await transcodeQueue.add('transcode-video', {
      inputPath,
      outputPath,
      options
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    res.json({
      message: 'Transcode job added successfully',
      jobId: job.id,
      status: 'queued'
    });
  } catch (error) {
    console.error('Add transcode job error:', error);
    res.status(500).json({ error: 'Failed to add transcode job' });
  }
});

// Add audio extraction job
app.post('/jobs/audio-extract', async (req, res) => {
  try {
    const { inputPath, outputPath, options = {} } = req.body;
    
    if (!inputPath || !outputPath) {
      return res.status(400).json({ 
        error: 'inputPath and outputPath are required' 
      });
    }

    const job = await audioExtractQueue.add('extract-audio', {
      inputPath,
      outputPath,
      options
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    res.json({
      message: 'Audio extraction job added successfully',
      jobId: job.id,
      status: 'queued'
    });
  } catch (error) {
    console.error('Add audio extraction job error:', error);
    res.status(500).json({ error: 'Failed to add audio extraction job' });
  }
});

// Add thumbnail generation job
app.post('/jobs/thumbnail', async (req, res) => {
  try {
    const { inputPath, outputPath, options = {} } = req.body;
    
    if (!inputPath || !outputPath) {
      return res.status(400).json({ 
        error: 'inputPath and outputPath are required' 
      });
    }

    const job = await thumbnailQueue.add('generate-thumbnail', {
      inputPath,
      outputPath,
      options
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    res.json({
      message: 'Thumbnail generation job added successfully',
      jobId: job.id,
      status: 'queued'
    });
  } catch (error) {
    console.error('Add thumbnail job error:', error);
    res.status(500).json({ error: 'Failed to add thumbnail job' });
  }
});

// Get job status
app.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check all queues for the job
    const queues = [transcodeQueue, audioExtractQueue, thumbnailQueue];
    let job = null;
    let queueName = null;

    for (const queue of queues) {
      job = await queue.getJob(jobId);
      if (job) {
        queueName = queue.name;
        break;
      }
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      jobId: job.id,
      queue: queueName,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// Get queue statistics
app.get('/queues/stats', async (req, res) => {
  try {
    const stats = {
      transcode: await transcodeQueue.getJobCounts(),
      audioExtract: await audioExtractQueue.getJobCounts(),
      thumbnail: await thumbnailQueue.getJobCounts()
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

// Clean completed jobs (older than 24 hours)
app.post('/queues/cleanup', async (req, res) => {
  try {
    const queues = [transcodeQueue, audioExtractQueue, thumbnailQueue];
    const results = {};

    for (const queue of queues) {
      const completed = await queue.clean(24 * 60 * 60 * 1000, 'completed');
      const failed = await queue.clean(24 * 60 * 60 * 1000, 'failed');
      
      results[queue.name] = {
        completed: completed.length,
        failed: failed.length
      };
    }

    res.json({
      message: 'Queue cleanup completed',
      results
    });
  } catch (error) {
    console.error('Queue cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup queues' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Media worker error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close queues
  await transcodeQueue.close();
  await audioExtractQueue.close();
  await thumbnailQueue.close();
  
  // Close Redis connection
  await redis.quit();
  
  process.exit(0);
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Media worker running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
