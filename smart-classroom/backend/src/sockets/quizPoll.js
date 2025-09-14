const Poll = require('../models/Poll');
const Quiz = require('../models/Quiz');

const quizPollHandler = (io, socket) => {
  // Create new poll
  socket.on('create-poll', async (data) => {
    try {
      const { lectureId, instructorId, question, options, duration } = data;
      
      const poll = new Poll({
        lecture: lectureId,
        instructor: instructorId,
        question,
        options: options.map(option => ({ text: option, votes: 0 })),
        duration,
        status: 'active'
      });
      
      await poll.save();
      
      // Broadcast poll to all participants in the lecture
      io.to(`lecture-${lectureId}`).emit('poll-created', {
        pollId: poll._id,
        question: poll.question,
        options: poll.options,
        duration: poll.duration,
        timestamp: new Date()
      });
      
      // Auto-end poll after duration
      if (duration > 0) {
        setTimeout(async () => {
          poll.status = 'ended';
          await poll.save();
          
          io.to(`lecture-${lectureId}`).emit('poll-ended', {
            pollId: poll._id,
            results: poll.options,
            timestamp: new Date()
          });
        }, duration * 1000);
      }
    } catch (error) {
      console.error('Create poll error:', error);
      socket.emit('error', { message: 'Failed to create poll' });
    }
  });

  // Vote on poll
  socket.on('vote-poll', async (data) => {
    try {
      const { pollId, userId, optionIndex } = data;
      
      const poll = await Poll.findById(pollId);
      if (!poll || poll.status !== 'active') {
        socket.emit('error', { message: 'Poll not found or not active' });
        return;
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
      
      // Broadcast updated results to all participants
      io.to(`lecture-${poll.lecture}`).emit('poll-results-updated', {
        pollId: poll._id,
        results: poll.options,
        totalVotes: poll.votes.length,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Vote poll error:', error);
      socket.emit('error', { message: 'Failed to vote on poll' });
    }
  });

  // End poll manually
  socket.on('end-poll', async (data) => {
    try {
      const { pollId, instructorId } = data;
      
      const poll = await Poll.findById(pollId);
      if (poll && poll.instructor.toString() === instructorId) {
        poll.status = 'ended';
        await poll.save();
        
        io.to(`lecture-${poll.lecture}`).emit('poll-ended', {
          pollId: poll._id,
          results: poll.options,
          totalVotes: poll.votes.length,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('End poll error:', error);
      socket.emit('error', { message: 'Failed to end poll' });
    }
  });

  // Create quiz
  socket.on('create-quiz', async (data) => {
    try {
      const { lectureId, instructorId, questions, duration, title } = data;
      
      const quiz = new Quiz({
        lecture: lectureId,
        instructor: instructorId,
        title,
        questions,
        duration,
        status: 'active'
      });
      
      await quiz.save();
      
      // Broadcast quiz to all participants
      io.to(`lecture-${lectureId}`).emit('quiz-created', {
        quizId: quiz._id,
        title: quiz.title,
        questionCount: quiz.questions.length,
        duration: quiz.duration,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Create quiz error:', error);
      socket.emit('error', { message: 'Failed to create quiz' });
    }
  });

  // Submit quiz answer
  socket.on('submit-quiz-answer', async (data) => {
    try {
      const { quizId, userId, questionId, answer } = data;
      
      const quiz = await Quiz.findById(quizId);
      if (!quiz || quiz.status !== 'active') {
        socket.emit('error', { message: 'Quiz not found or not active' });
        return;
      }
      
      // Check if user already answered this question
      const existingAnswer = quiz.answers.find(
        ans => ans.user.toString() === userId && ans.questionId.toString() === questionId
      );
      
      if (existingAnswer) {
        // Update existing answer
        existingAnswer.answer = answer;
        existingAnswer.submittedAt = new Date();
      } else {
        // Add new answer
        quiz.answers.push({
          user: userId,
          questionId,
          answer,
          submittedAt: new Date()
        });
      }
      
      await quiz.save();
      
      // Notify instructor about answer submission
      socket.to(`lecture-${quiz.lecture}`).emit('quiz-answer-submitted', {
        quizId: quiz._id,
        userId,
        questionId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Submit quiz answer error:', error);
      socket.emit('error', { message: 'Failed to submit quiz answer' });
    }
  });

  // End quiz
  socket.on('end-quiz', async (data) => {
    try {
      const { quizId, instructorId } = data;
      
      const quiz = await Quiz.findById(quizId);
      if (quiz && quiz.instructor.toString() === instructorId) {
        quiz.status = 'ended';
        quiz.endTime = new Date();
        
        // Calculate scores
        quiz.answers.forEach(answer => {
          const question = quiz.questions.id(answer.questionId);
          if (question && question.correctAnswer === answer.answer) {
            answer.isCorrect = true;
          }
        });
        
        await quiz.save();
        
        // Broadcast quiz results
        io.to(`lecture-${quiz.lecture}`).emit('quiz-ended', {
          quizId: quiz._id,
          results: quiz.answers,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('End quiz error:', error);
      socket.emit('error', { message: 'Failed to end quiz' });
    }
  });

  // Get poll results
  socket.on('get-poll-results', async (data) => {
    try {
      const { pollId } = data;
      
      const poll = await Poll.findById(pollId);
      if (poll) {
        socket.emit('poll-results', {
          pollId: poll._id,
          results: poll.options,
          totalVotes: poll.votes.length,
          status: poll.status
        });
      }
    } catch (error) {
      console.error('Get poll results error:', error);
      socket.emit('error', { message: 'Failed to get poll results' });
    }
  });

  // Get quiz results
  socket.on('get-quiz-results', async (data) => {
    try {
      const { quizId, userId } = data;
      
      const quiz = await Quiz.findById(quizId);
      if (quiz) {
        const userAnswers = quiz.answers.filter(
          answer => answer.user.toString() === userId
        );
        
        socket.emit('quiz-results', {
          quizId: quiz._id,
          userAnswers,
          totalQuestions: quiz.questions.length,
          status: quiz.status
        });
      }
    } catch (error) {
      console.error('Get quiz results error:', error);
      socket.emit('error', { message: 'Failed to get quiz results' });
    }
  });
};

module.exports = quizPollHandler;
