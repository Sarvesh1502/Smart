const express = require('express');
const { body, validationResult } = require('express-validator');
const TeacherSheet = require('../models/TeacherSheet');
const { requireFacultyOrAdmin } = require('../utils/authMiddleware');

const router = express.Router();

// Get teacher sheets for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { role, userId } = req.user || {};

    let query = { course: courseId };
    if (role === 'faculty') {
      query.teacher = userId;
    }

    const sheets = await TeacherSheet.find(query)
      .populate('teacher', 'name email')
      .populate('course', 'title subject')
      .sort({ createdAt: -1 });

    res.json({ sheets });
  } catch (error) {
    console.error('Get teacher sheets error:', error);
    res.status(500).json({ message: 'Server error fetching teacher sheets' });
  }
});

// Get single teacher sheet
router.get('/:id', async (req, res) => {
  try {
    const sheet = await TeacherSheet.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('course', 'title subject');

    if (!sheet) {
      return res.status(404).json({ message: 'Teacher sheet not found' });
    }

    // Check permissions
    const { role, userId } = req.user || {};
    if (role === 'faculty' && sheet.teacher.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ sheet });
  } catch (error) {
    console.error('Get teacher sheet error:', error);
    res.status(500).json({ message: 'Server error fetching teacher sheet' });
  }
});

// Create new teacher sheet
router.post('/', requireFacultyOrAdmin, [
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('googleSheetId').notEmpty().withMessage('Google Sheet ID is required'),
  body('sheetName').trim().notEmpty().withMessage('Sheet name is required'),
  body('sheetUrl').isURL().withMessage('Valid sheet URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { course, googleSheetId, sheetName, sheetUrl, columns, dataMapping } = req.body;
    const teacherId = req.user.userId;

    const sheetData = {
      course,
      teacher: teacherId,
      googleSheetId,
      sheetName,
      sheetUrl,
      columns: columns || [],
      dataMapping: dataMapping || {}
    };

    const sheet = new TeacherSheet(sheetData);
    await sheet.save();

    await sheet.populate('teacher', 'name email');
    await sheet.populate('course', 'title subject');

    res.status(201).json({
      message: 'Teacher sheet created successfully',
      sheet
    });
  } catch (error) {
    console.error('Create teacher sheet error:', error);
    res.status(500).json({ message: 'Server error creating teacher sheet' });
  }
});

// Update teacher sheet
router.put('/:id', requireFacultyOrAdmin, async (req, res) => {
  try {
    const sheetId = req.params.id;
    const userId = req.user.userId;

    const sheet = await TeacherSheet.findById(sheetId);
    if (!sheet) {
      return res.status(404).json({ message: 'Teacher sheet not found' });
    }

    // Check permissions
    if (req.user.role === 'faculty' && sheet.teacher.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove sensitive fields
    delete req.body._id;
    delete req.body.course;
    delete req.body.teacher;

    const updatedSheet = await TeacherSheet.findByIdAndUpdate(
      sheetId,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('teacher', 'name email')
     .populate('course', 'title subject');

    res.json({
      message: 'Teacher sheet updated successfully',
      sheet: updatedSheet
    });
  } catch (error) {
    console.error('Update teacher sheet error:', error);
    res.status(500).json({ message: 'Server error updating teacher sheet' });
  }
});

// Delete teacher sheet
router.delete('/:id', requireFacultyOrAdmin, async (req, res) => {
  try {
    const sheetId = req.params.id;
    const userId = req.user.userId;

    const sheet = await TeacherSheet.findById(sheetId);
    if (!sheet) {
      return res.status(404).json({ message: 'Teacher sheet not found' });
    }

    // Check permissions
    if (req.user.role === 'faculty' && sheet.teacher.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await TeacherSheet.findByIdAndDelete(sheetId);

    res.json({ message: 'Teacher sheet deleted successfully' });
  } catch (error) {
    console.error('Delete teacher sheet error:', error);
    res.status(500).json({ message: 'Server error deleting teacher sheet' });
  }
});

// Sync with Google Sheets
router.post('/:id/sync', requireFacultyOrAdmin, async (req, res) => {
  try {
    const sheetId = req.params.id;
    const userId = req.user.userId;

    const sheet = await TeacherSheet.findById(sheetId);
    if (!sheet) {
      return res.status(404).json({ message: 'Teacher sheet not found' });
    }

    // Check permissions
    if (req.user.role === 'faculty' && sheet.teacher.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update sync status
    sheet.syncSettings.syncStatus = 'syncing';
    sheet.syncSettings.lastSync = new Date();
    await sheet.save();

    // Here you would typically call the sheet-sync microservice
    // For now, we'll simulate the sync
    setTimeout(async () => {
      sheet.syncSettings.syncStatus = 'idle';
      sheet.analytics.lastModified = new Date();
      sheet.analytics.modificationCount++;
      await sheet.save();
    }, 2000);

    res.json({
      message: 'Sync initiated successfully',
      syncStatus: 'syncing'
    });
  } catch (error) {
    console.error('Sync teacher sheet error:', error);
    res.status(500).json({ message: 'Server error syncing teacher sheet' });
  }
});

// Get sync status
router.get('/:id/sync-status', async (req, res) => {
  try {
    const sheet = await TeacherSheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: 'Teacher sheet not found' });
    }

    res.json({
      syncStatus: sheet.syncSettings.syncStatus,
      lastSync: sheet.syncSettings.lastSync,
      lastError: sheet.syncSettings.lastError,
      autoSync: sheet.syncSettings.autoSync,
      syncInterval: sheet.syncSettings.syncInterval
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ message: 'Server error fetching sync status' });
  }
});

// Update sync settings
router.put('/:id/sync-settings', requireFacultyOrAdmin, [
  body('autoSync').optional().isBoolean(),
  body('syncInterval').optional().isInt({ min: 1, max: 1440 }) // 1 minute to 24 hours
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sheetId = req.params.id;
    const userId = req.user.userId;

    const sheet = await TeacherSheet.findById(sheetId);
    if (!sheet) {
      return res.status(404).json({ message: 'Teacher sheet not found' });
    }

    // Check permissions
    if (req.user.role === 'faculty' && sheet.teacher.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { autoSync, syncInterval } = req.body;
    
    if (autoSync !== undefined) {
      sheet.syncSettings.autoSync = autoSync;
    }
    if (syncInterval !== undefined) {
      sheet.syncSettings.syncInterval = syncInterval;
    }

    await sheet.save();

    res.json({
      message: 'Sync settings updated successfully',
      syncSettings: sheet.syncSettings
    });
  } catch (error) {
    console.error('Update sync settings error:', error);
    res.status(500).json({ message: 'Server error updating sync settings' });
  }
});

module.exports = router;
