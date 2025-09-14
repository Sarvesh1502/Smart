const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config();

// Import services
const authService = require('./googleAPI/auth');
const sheetsClient = require('./googleAPI/sheetsClient');
const pullFromSheet = require('./syncHandlers/pullFromSheet');
const pushToSheet = require('./syncHandlers/pushToSheet');
const conflictResolver = require('./syncHandlers/conflictResolver');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Sheet Sync Service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    googleAuth: authService.isAuthenticated()
  });
});

// Authentication endpoints
app.get('/auth/google', async (req, res) => {
  try {
    const authUrl = await authService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Failed to get Google auth URL' });
  }
});

app.post('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.body;
    const tokens = await authService.getTokensFromCode(code);
    res.json({ success: true, tokens });
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// Sheet operations endpoints
app.get('/sheets/:sheetId', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { range } = req.query;
    
    const data = await sheetsClient.getSheetData(sheetId, range);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get sheet data error:', error);
    res.status(500).json({ error: 'Failed to get sheet data' });
  }
});

app.post('/sheets/:sheetId/update', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { range, values } = req.body;
    
    const result = await sheetsClient.updateSheetData(sheetId, range, values);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Update sheet data error:', error);
    res.status(500).json({ error: 'Failed to update sheet data' });
  }
});

app.post('/sheets/:sheetId/append', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { range, values } = req.body;
    
    const result = await sheetsClient.appendSheetData(sheetId, range, values);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Append sheet data error:', error);
    res.status(500).json({ error: 'Failed to append sheet data' });
  }
});

// Sync operations endpoints
app.post('/sync/pull', async (req, res) => {
  try {
    const { sheetId, range, targetCollection } = req.body;
    
    const result = await pullFromSheet.pullData(sheetId, range, targetCollection);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Pull sync error:', error);
    res.status(500).json({ error: 'Failed to pull data from sheet' });
  }
});

app.post('/sync/push', async (req, res) => {
  try {
    const { sheetId, range, sourceData } = req.body;
    
    const result = await pushToSheet.pushData(sheetId, range, sourceData);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Push sync error:', error);
    res.status(500).json({ error: 'Failed to push data to sheet' });
  }
});

app.post('/sync/bidirectional', async (req, res) => {
  try {
    const { sheetId, range, localData, conflictResolution = 'local' } = req.body;
    
    // Pull data from sheet
    const sheetData = await pullFromSheet.pullData(sheetId, range);
    
    // Resolve conflicts
    const resolvedData = await conflictResolver.resolveConflicts(
      localData,
      sheetData,
      conflictResolution
    );
    
    // Push resolved data back to sheet
    const result = await pushToSheet.pushData(sheetId, range, resolvedData);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Bidirectional sync error:', error);
    res.status(500).json({ error: 'Failed to perform bidirectional sync' });
  }
});

// Batch operations endpoints
app.post('/batch/sync', async (req, res) => {
  try {
    const { operations } = req.body;
    
    const results = [];
    for (const operation of operations) {
      try {
        let result;
        switch (operation.type) {
          case 'pull':
            result = await pullFromSheet.pullData(
              operation.sheetId,
              operation.range,
              operation.targetCollection
            );
            break;
          case 'push':
            result = await pushToSheet.pushData(
              operation.sheetId,
              operation.range,
              operation.sourceData
            );
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        results.push({ success: true, operation: operation.type, result });
      } catch (error) {
        results.push({ success: false, operation: operation.type, error: error.message });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({ error: 'Failed to perform batch sync' });
  }
});

// Sheet metadata endpoints
app.get('/sheets/:sheetId/metadata', async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    const metadata = await sheetsClient.getSheetMetadata(sheetId);
    res.json({ success: true, metadata });
  } catch (error) {
    console.error('Get sheet metadata error:', error);
    res.status(500).json({ error: 'Failed to get sheet metadata' });
  }
});

app.get('/sheets/:sheetId/permissions', async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    const permissions = await sheetsClient.getSheetPermissions(sheetId);
    res.json({ success: true, permissions });
  } catch (error) {
    console.error('Get sheet permissions error:', error);
    res.status(500).json({ error: 'Failed to get sheet permissions' });
  }
});

// Sync status and history endpoints
app.get('/sync/status/:sheetId', async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    const status = await getSyncStatus(sheetId);
    res.json({ success: true, status });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

app.get('/sync/history/:sheetId', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await getSyncHistory(sheetId, limit);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Get sync history error:', error);
    res.status(500).json({ error: 'Failed to get sync history' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Sheet sync service error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Scheduled sync jobs
if (process.env.ENABLE_SCHEDULED_SYNC === 'true') {
  // Run sync every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('Running scheduled sync...');
      await runScheduledSync();
    } catch (error) {
      console.error('Scheduled sync error:', error);
    }
  });
}

// Helper functions
async function getSyncStatus(sheetId) {
  // In a real implementation, this would check a database
  return {
    sheetId: sheetId,
    lastSync: new Date(),
    status: 'active',
    nextSync: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
  };
}

async function getSyncHistory(sheetId, limit) {
  // In a real implementation, this would query a database
  return [
    {
      timestamp: new Date(),
      operation: 'pull',
      status: 'success',
      recordsProcessed: 25
    },
    {
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      operation: 'push',
      status: 'success',
      recordsProcessed: 15
    }
  ].slice(0, limit);
}

async function runScheduledSync() {
  // In a real implementation, this would sync all configured sheets
  console.log('Scheduled sync completed');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Sheet sync service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
