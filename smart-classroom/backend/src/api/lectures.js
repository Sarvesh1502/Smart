const express = require('express');
const { body, validationResult } = require('express-validator');
const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const { authMiddleware, requireFacultyOrAdmin } = require('../utils/authMiddleware');

const router = express.Router();

// Get all lectures for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, type, status } = req.query;

    let query = { course: courseId };
    if (type) query.type = type;
    if (status) query.status = status;

    const lectures = await Lecture.find(query)
      .populate('instructor', 'name email profile.avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Lecture.countDocuments(query);

    res.json({
      lectures,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get lectures error:', error);
    res.status(500).json({ message: 'Server error fetching lectures' });
  }
});

// Get single lecture
router.get('/:id', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id)
      .populate('instructor', 'name email profile.avatar')
      .populate('course', 'title subject')
      .populate('attendance.student', 'name email studentInfo.rollNumber');

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    res.json({ lecture });
  } catch (error) {
    console.error('Get lecture error:', error);
    res.status(500).json({ message: 'Server error fetching lecture' });
  }
});

// Create new lecture
router.post('/', requireFacultyOrAdmin, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('type').isIn(['live', 'recorded', 'scheduled']).withMessage('Valid lecture type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { course, type, scheduledTime } = req.body;
    const instructorId = req.user.userId;

    // Verify course exists and user has access
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role === 'faculty' && courseDoc.instructor.toString() !== instructorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const lectureData = {
      ...req.body,
      instructor: instructorId
    };

    // Set scheduled time for scheduled lectures
    if (type === 'scheduled' && scheduledTime) {
      lectureData.scheduledTime = {
        start: new Date(scheduledTime.start),
        end: new Date(scheduledTime.end)
      };
    }

    const lecture = new Lecture(lectureData);
    await lecture.save();

    // Add lecture to course
    await Course.findByIdAndUpdate(course, {
      $push: { lectures: lecture._id }
    });

    await lecture.populate('instructor', 'name email profile.avatar');
    await lecture.populate('course', 'title subject');

    res.status(201).json({
      message: 'Lecture created successfully',
      lecture
    });
  } catch (error) {
    console.error('Create lecture error:', error);
    res.status(500).json({ message: 'Server error creating lecture' });
  }
});

// Update lecture
router.put('/:id', requireFacultyOrAdmin, [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const lectureId = req.params.id;
    const userId = req.user.userId;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check permissions
    if (req.user.role === 'faculty' && lecture.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove sensitive fields
    delete req.body._id;
    delete req.body.instructor;
    delete req.body.course;

    const updatedLecture = await Lecture.findByIdAndUpdate(
      lectureId,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('instructor', 'name email profile.avatar');

    res.json({
      message: 'Lecture updated successfully',
      lecture: updatedLecture
    });
  } catch (error) {
    console.error('Update lecture error:', error);
    res.status(500).json({ message: 'Server error updating lecture' });
  }
});

// Delete lecture
router.delete('/:id', requireFacultyOrAdmin, async (req, res) => {
  try {
    const lectureId = req.params.id;
    const userId = req.user.userId;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check permissions
    if (req.user.role === 'faculty' && lecture.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove lecture from course
    await Course.findByIdAndUpdate(lecture.course, {
      $pull: { lectures: lectureId }
    });

    await Lecture.findByIdAndDelete(lectureId);

    res.json({ message: 'Lecture deleted successfully' });
  } catch (error) {
    console.error('Delete lecture error:', error);
    res.status(500).json({ message: 'Server error deleting lecture' });
  }
});

// Get lecture attendance
router.get('/:id/attendance', async (req, res) => {
  try {
    const lectureId = req.params.id;
    const { role, userId } = req.user || {};

    const lecture = await Lecture.findById(lectureId)
      .populate('attendance.student', 'name email studentInfo.rollNumber');

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check access permissions
    if (role === 'student' && !lecture.attendance.some(a => a.student._id.toString() === userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (role === 'faculty' && lecture.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ attendance: lecture.attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
});

// Get lecture analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const lectureId = req.params.id;
    const { role, userId } = req.user || {};

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check permissions
    if (role === 'faculty' && lecture.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (role === 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const analytics = {
      totalViews: lecture.analytics.totalViews,
      averageWatchTime: lecture.analytics.averageWatchTime,
      completionRate: lecture.analytics.completionRate,
      engagementScore: lecture.analytics.engagementScore,
      attendanceCount: lecture.attendanceCount,
      participantCount: lecture.participantCount,
      chatMessagesCount: lecture.liveSession.chatMessages.length
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// Upload lecture materials
router.post('/:id/materials', requireFacultyOrAdmin, async (req, res) => {
  try {
    const lectureId = req.params.id;
    const userId = req.user.userId;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check permissions
    if (req.user.role === 'faculty' && lecture.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { materials } = req.body;
    lecture.materials.push(...materials);
    await lecture.save();

    res.json({
      message: 'Materials uploaded successfully',
      materials: lecture.materials
    });
  } catch (error) {
    console.error('Upload materials error:', error);
    res.status(500).json({ message: 'Server error uploading materials' });
  }
});

// Get live session info
router.get('/:id/live-session', async (req, res) => {
  try {
    const lectureId = req.params.id;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const liveSessionInfo = {
      jitsiRoomId: lecture.liveSession.jitsiRoomId,
      status: lecture.status,
      startTime: lecture.liveSession.startTime,
      endTime: lecture.liveSession.endTime,
      participants: lecture.liveSession.participants.length,
      chatMessages: lecture.liveSession.chatMessages.slice(-50) // Last 50 messages
    };

    res.json({ liveSession: liveSessionInfo });
  } catch (error) {
    console.error('Get live session error:', error);
    res.status(500).json({ message: 'Server error fetching live session info' });
  }
});

// Get meeting information for live session
router.get('/:lectureId/meeting', authMiddleware, async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { userId, role } = req.user;

    const lecture = await Lecture.findById(lectureId)
      .populate('course', 'title instructor')
      .populate('instructor', 'name email');

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check if user has access to this lecture
    const course = await Course.findById(lecture.course._id);
    if (role === 'student' && !course.students.includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (role === 'faculty' && course.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate meeting room name
    const roomName = `smart-classroom-${lectureId}`;
    
    // Check if meeting is currently live
    const isLive = lecture.type === 'live' && 
                   lecture.status === 'active' &&
                   lecture.scheduledTime &&
                   new Date() >= new Date(lecture.scheduledTime.start) &&
                   new Date() <= new Date(lecture.scheduledTime.end);

    const meetingInfo = {
      id: lecture._id,
      title: lecture.title,
      description: lecture.description,
      roomName: roomName,
      status: isLive ? 'live' : 'scheduled',
      scheduledTime: lecture.scheduledTime,
      settings: lecture.settings,
      instructor: {
        name: lecture.instructor.name,
        email: lecture.instructor.email
      },
      course: {
        title: lecture.course.title
      }
    };

    res.json(meetingInfo);
  } catch (error) {
    console.error('Get meeting info error:', error);
    res.status(500).json({ message: 'Server error fetching meeting info' });
  }
});

// Start live session
router.post('/:lectureId/start-live', authMiddleware, requireFacultyOrAdmin, async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { userId } = req.user;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check if user is the instructor
    if (lecture.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Only the instructor can start the live session' });
    }

    // Update lecture status
    lecture.status = 'active';
    lecture.startedAt = new Date();
    await lecture.save();

    res.json({ 
      message: 'Live session started successfully',
      roomName: `smart-classroom-${lectureId}`,
      status: 'live'
    });
  } catch (error) {
    console.error('Start live session error:', error);
    res.status(500).json({ message: 'Server error starting live session' });
  }
});

// End live session
router.post('/:lectureId/end-live', authMiddleware, requireFacultyOrAdmin, async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { userId } = req.user;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check if user is the instructor
    if (lecture.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Only the instructor can end the live session' });
    }

    // Update lecture status
    lecture.status = 'completed';
    lecture.endedAt = new Date();
    await lecture.save();

    res.json({ message: 'Live session ended successfully' });
  } catch (error) {
    console.error('End live session error:', error);
    res.status(500).json({ message: 'Server error ending live session' });
  }
});

module.exports = router;
