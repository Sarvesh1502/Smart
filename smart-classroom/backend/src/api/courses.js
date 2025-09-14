const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const { authMiddleware, requireFacultyOrAdmin } = require('../utils/authMiddleware');

const router = express.Router();

// Get all courses (with role-based filtering)
router.get('/', async (req, res) => {
  try {
    const { role, userId } = req.user || {};
    const { page = 1, limit = 10, subject, class: classFilter, status } = req.query;

    let query = {};
    
    // Role-based filtering
    if (role === 'student') {
      query.students = userId;
    } else if (role === 'faculty') {
      query.instructor = userId;
    }
    // Admin can see all courses

    // Additional filters
    if (subject) query.subject = subject;
    if (classFilter) query.class = classFilter;
    if (status) query.status = status;

    const courses = await Course.find(query)
      .populate('instructor', 'name email profile.avatar')
      .populate('students', 'name email studentInfo.rollNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email profile.avatar facultyInfo')
      .populate('students', 'name email studentInfo.rollNumber profile.avatar')
      .populate('lectures', 'title type status scheduledTime')
      .populate('assignments', 'title dueDate status');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check access permissions
    const { role, userId } = req.user || {};
    if (role === 'student' && !course.students.includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (role === 'faculty' && course.instructor._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error fetching course' });
  }
});

// Create new course (faculty/admin only)
router.post('/', authMiddleware, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('class').trim().notEmpty().withMessage('Class is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, userId } = req.user;
    
    // Only faculty and admin can create courses
    if (role !== 'faculty' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const courseData = {
      ...req.body,
      instructor: role === 'faculty' ? userId : req.body.instructor || userId
    };

    const course = new Course(courseData);
    await course.save();

    // Populate instructor data
    await course.populate('instructor', 'name email profile.avatar');

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
});

// Update course
router.put('/:id', authMiddleware, [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, userId } = req.user;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    if (role === 'faculty' && course.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (role === 'student') {
      return res.status(403).json({ message: 'Students cannot modify courses' });
    }

    // Remove sensitive fields
    delete req.body._id;
    delete req.body.instructor;
    delete req.body.students;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('instructor', 'name email profile.avatar');

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
});

// Delete course
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    if (role === 'faculty' && course.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (role === 'student') {
      return res.status(403).json({ message: 'Students cannot delete courses' });
    }

    await Course.findByIdAndDelete(courseId);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
});

// Enroll student in course
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const courseId = req.params.id;

    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can enroll in courses' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    if (course.students.includes(userId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check enrollment deadline
    if (course.enrollmentDeadline && new Date() > course.enrollmentDeadline) {
      return res.status(400).json({ message: 'Enrollment deadline has passed' });
    }

    // Check max students limit
    if (course.students.length >= course.settings.maxStudents) {
      return res.status(400).json({ message: 'Course is full' });
    }

    await course.addStudent(userId);

    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error enrolling in course' });
  }
});

// Unenroll student from course
router.delete('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const courseId = req.params.id;

    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can unenroll from courses' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await course.removeStudent(userId);

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ message: 'Server error unenrolling from course' });
  }
});

// Get course analytics
router.get('/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    if (role === 'faculty' && course.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (role === 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get analytics data
    const analytics = {
      totalStudents: course.students.length,
      totalLectures: course.lectures.length,
      averageAttendance: course.analytics.averageAttendance,
      completionRate: course.analytics.completionRate,
      totalViews: course.analytics.totalViews
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// Get course students
router.get('/:id/students', authMiddleware, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const courseId = req.params.id;

    const course = await Course.findById(courseId)
      .populate('students', 'name email studentInfo profile.avatar');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    if (role === 'faculty' && course.instructor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (role === 'student' && !course.students.includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ students: course.students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

module.exports = router;
