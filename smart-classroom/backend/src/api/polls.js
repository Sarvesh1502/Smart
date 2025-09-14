const express = require('express');
const { body, validationResult } = require('express-validator');
const Poll = require('../models/Poll');
const { requireFacultyOrAdmin } = require('../utils/authMiddleware');

const router = express.Router();

// Get polls for a lecture
router.get('/lecture/:lectureId', async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    let query = { lecture: lectureId };
    if (status) query.status = status;

    const polls = await Poll.find(query)
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Poll.countDocuments(query);

    res.json({
      polls,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ message: 'Server error fetching polls' });
  }
});

// Get single poll
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('votes.user', 'name email');

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    res.json({ poll });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ message: 'Server error fetching poll' });
  }
});

// Create new poll
router.post('/', requireFacultyOrAdmin, [
  body('lecture').isMongoId().withMessage('Valid lecture ID is required'),
  body('question').trim().isLength({ min: 5 }).withMessage('Question must be at least 5 characters'),
  body('options').isArray({ min: 2 }).withMessage('At least 2 options are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lecture, question, options, duration } = req.body;
    const instructorId = req.user.userId;

    const pollData = {
      lecture,
      instructor: instructorId,
      question,
      options: options.map(option => ({ text: option, votes: 0 })),
      duration: duration || 0
    };

    const poll = new Poll(pollData);
    await poll.save();

    await poll.populate('instructor', 'name email');

    res.status(201).json({
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ message: 'Server error creating poll' });
  }
});

// Vote on poll
router.post('/:id/vote', [
  body('optionIndex').isInt({ min: 0 }).withMessage('Valid option index is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pollId = req.params.id;
    const { optionIndex } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status !== 'active') {
      return res.status(400).json({ message: 'Poll is not active' });
    }

    if (optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option index' });
    }

    // Check if user already voted
    const existingVote = poll.votes.find(vote => vote.user.toString() === userId);
    if (existingVote) {
      // Update existing vote
      poll.options[existingVote.optionIndex].votes--;
      existingVote.optionIndex = optionIndex;
      poll.options[optionIndex].votes++;
    } else {
      // Add new vote
      poll.votes.push({ user: userId, optionIndex });
      poll.options[optionIndex].votes++;
    }

    await poll.save();

    res.json({
      message: 'Vote recorded successfully',
      poll: {
        _id: poll._id,
        options: poll.options,
        totalVotes: poll.votes.length
      }
    });
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({ message: 'Server error voting on poll' });
  }
});

// End poll
router.put('/:id/end', requireFacultyOrAdmin, async (req, res) => {
  try {
    const pollId = req.params.id;
    const userId = req.user.userId;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    poll.status = 'ended';
    poll.endTime = new Date();
    await poll.save();

    res.json({
      message: 'Poll ended successfully',
      poll: {
        _id: poll._id,
        status: poll.status,
        results: poll.options,
        totalVotes: poll.votes.length
      }
    });
  } catch (error) {
    console.error('End poll error:', error);
    res.status(500).json({ message: 'Server error ending poll' });
  }
});

// Get poll results
router.get('/:id/results', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('votes.user', 'name email');

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const results = {
      _id: poll._id,
      question: poll.question,
      options: poll.options,
      totalVotes: poll.votes.length,
      status: poll.status,
      startTime: poll.startTime,
      endTime: poll.endTime,
      votes: poll.votes
    };

    res.json({ results });
  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({ message: 'Server error fetching poll results' });
  }
});

module.exports = router;
