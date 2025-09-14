const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../backend/src/models/User');
const Course = require('../backend/src/models/Course');
const Lecture = require('../backend/src/models/Lecture');
const FAQ = require('../backend/src/models/FAQ');

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@smartclassroom.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      phone: '+91-9876543210',
      address: {
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001'
      }
    }
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@smartclassroom.com',
    password: 'teacher123',
    role: 'faculty',
    profile: {
      phone: '+91-9876543211',
      address: {
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001'
      }
    },
    facultyInfo: {
      employeeId: 'FAC001',
      department: 'Mathematics',
      qualification: 'Ph.D. in Mathematics',
      experience: 10,
      subjects: ['Mathematics', 'Statistics'],
      classes: []
    }
  },
  {
    name: 'Ram Kumar',
    email: 'ram.kumar@smartclassroom.com',
    password: 'student123',
    role: 'student',
    profile: {
      phone: '+91-9876543212',
      address: {
        city: 'Jodhpur',
        state: 'Rajasthan',
        pincode: '342001'
      }
    },
    studentInfo: {
      rollNumber: 'STU001',
      class: '10th',
      section: 'A',
      parentName: 'Shyam Kumar',
      parentPhone: '+91-9876543213',
      enrollmentDate: new Date(),
      courses: []
    }
  }
];

const sampleCourses = [
  {
    title: 'Mathematics Class 10',
    description: 'Complete mathematics course for class 10 students covering algebra, geometry, and trigonometry.',
    subject: 'Mathematics',
    class: '10th',
    section: 'A',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    schedule: {
      days: ['monday', 'wednesday', 'friday'],
      time: {
        start: '10:00',
        end: '11:00'
      },
      timezone: 'Asia/Kolkata'
    },
    settings: {
      isLiveStreamingEnabled: true,
      isRecordingEnabled: true,
      allowStudentQuestions: true,
      maxStudents: 50,
      autoAttendance: true
    },
    status: 'active'
  },
  {
    title: 'Science Class 9',
    description: 'Comprehensive science course covering physics, chemistry, and biology for class 9 students.',
    subject: 'Science',
    class: '9th',
    section: 'B',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    schedule: {
      days: ['tuesday', 'thursday', 'saturday'],
      time: {
        start: '11:00',
        end: '12:00'
      },
      timezone: 'Asia/Kolkata'
    },
    settings: {
      isLiveStreamingEnabled: true,
      isRecordingEnabled: true,
      allowStudentQuestions: true,
      maxStudents: 45,
      autoAttendance: true
    },
    status: 'active'
  }
];

const sampleLectures = [
  {
    title: 'Introduction to Algebra',
    description: 'Basic concepts of algebra including variables, constants, and expressions.',
    type: 'recorded',
    status: 'completed',
    materials: [
      {
        title: 'Algebra Basics PDF',
        type: 'document',
        url: '/materials/algebra-basics.pdf',
        description: 'Comprehensive guide to algebra basics',
        isRequired: true
      }
    ],
    slides: [
      {
        slideNumber: 1,
        title: 'What is Algebra?',
        content: 'Algebra is a branch of mathematics that uses symbols and letters to represent numbers and quantities.',
        notes: 'Start with simple examples'
      },
      {
        slideNumber: 2,
        title: 'Variables and Constants',
        content: 'Variables are symbols that represent unknown values, while constants have fixed values.',
        notes: 'Use x, y, z as common variables'
      }
    ],
    settings: {
      allowQuestions: true,
      allowChat: true,
      recordSession: true,
      autoAttendance: true
    }
  },
  {
    title: 'Live Session: Problem Solving',
    description: 'Interactive problem-solving session for algebra concepts.',
    type: 'live',
    status: 'scheduled',
    scheduledTime: {
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      timezone: 'Asia/Kolkata'
    },
    settings: {
      allowQuestions: true,
      allowChat: true,
      recordSession: true,
      autoAttendance: true
    }
  }
];

const sampleFAQs = [
  {
    question: 'How do I join a live class?',
    answer: 'To join a live class, go to your dashboard, find the scheduled class, and click on "Join Live Class". Make sure you have a stable internet connection.',
    category: 'General',
    subcategory: 'Live Classes',
    tags: ['live class', 'joining', 'connection'],
    priority: 5,
    language: 'en'
  },
  {
    question: 'What should I do if I miss a live class?',
    answer: 'If you miss a live class, you can watch the recorded version which will be available within 24 hours. Go to the lecture page and click on "Watch Recording".',
    category: 'General',
    subcategory: 'Recordings',
    tags: ['missed class', 'recording', 'catch up'],
    priority: 4,
    language: 'en'
  },
  {
    question: 'How can I ask doubts during a live class?',
    answer: 'You can ask doubts by typing in the chat box during the live class. The teacher will respond to your questions. You can also raise your hand using the hand raise feature.',
    category: 'General',
    subcategory: 'Doubts',
    tags: ['doubts', 'chat', 'hand raise'],
    priority: 4,
    language: 'en'
  },
  {
    question: 'Can I ask questions in Hindi?',
    answer: 'Yes, you can ask questions in Hindi. The platform supports both Hindi and English languages.',
    category: 'General',
    subcategory: 'Language',
    tags: ['hindi', 'language', 'questions'],
    priority: 3,
    language: 'en'
  }
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-classroom');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  try {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lecture.deleteMany({});
    await FAQ.deleteMany({});
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

async function seedUsers() {
  try {
    console.log('Seeding users...');
    
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.name} (${userData.role})`);
      } else {
        console.log(`User already exists: ${userData.name}`);
      }
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

async function seedCourses() {
  try {
    console.log('Seeding courses...');
    
    const faculty = await User.findOne({ role: 'faculty' });
    if (!faculty) {
      console.log('No faculty found, skipping courses');
      return;
    }
    
    for (const courseData of sampleCourses) {
      const existingCourse = await Course.findOne({ 
        title: courseData.title,
        instructor: faculty._id 
      });
      
      if (!existingCourse) {
        const course = new Course({
          ...courseData,
          instructor: faculty._id
        });
        await course.save();
        
        // Update faculty's classes
        faculty.facultyInfo.classes.push(course._id);
        await faculty.save();
        
        console.log(`Created course: ${courseData.title}`);
      } else {
        console.log(`Course already exists: ${courseData.title}`);
      }
    }
  } catch (error) {
    console.error('Error seeding courses:', error);
  }
}

async function seedLectures() {
  try {
    console.log('Seeding lectures...');
    
    const faculty = await User.findOne({ role: 'faculty' });
    const courses = await Course.find({ instructor: faculty._id });
    
    if (courses.length === 0) {
      console.log('No courses found, skipping lectures');
      return;
    }
    
    for (const lectureData of sampleLectures) {
      const course = courses[0]; // Use first course
      const existingLecture = await Lecture.findOne({ 
        title: lectureData.title,
        course: course._id 
      });
      
      if (!existingLecture) {
        const lecture = new Lecture({
          ...lectureData,
          course: course._id,
          instructor: faculty._id
        });
        await lecture.save();
        
        // Update course's lectures
        course.lectures.push(lecture._id);
        await course.save();
        
        console.log(`Created lecture: ${lectureData.title}`);
      } else {
        console.log(`Lecture already exists: ${lectureData.title}`);
      }
    }
  } catch (error) {
    console.error('Error seeding lectures:', error);
  }
}

async function seedFAQs() {
  try {
    console.log('Seeding FAQs...');
    
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found, skipping FAQs');
      return;
    }
    
    for (const faqData of sampleFAQs) {
      const existingFAQ = await FAQ.findOne({ 
        question: faqData.question,
        language: faqData.language 
      });
      
      if (!existingFAQ) {
        const faq = new FAQ({
          ...faqData,
          createdBy: admin._id
        });
        await faq.save();
        console.log(`Created FAQ: ${faqData.question.substring(0, 50)}...`);
      } else {
        console.log(`FAQ already exists: ${faqData.question.substring(0, 50)}...`);
      }
    }
  } catch (error) {
    console.error('Error seeding FAQs:', error);
  }
}

async function enrollStudents() {
  try {
    console.log('Enrolling students in courses...');
    
    const students = await User.find({ role: 'student' });
    const courses = await Course.find({ status: 'active' });
    
    for (const student of students) {
      for (const course of courses) {
        if (!course.students.includes(student._id)) {
          course.students.push(student._id);
          student.studentInfo.courses.push(course._id);
          
          await course.save();
          await student.save();
          
          console.log(`Enrolled ${student.name} in ${course.title}`);
        }
      }
    }
  } catch (error) {
    console.error('Error enrolling students:', error);
  }
}

async function main() {
  try {
    console.log('Starting database seeding...');
    
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data
    await seedUsers();
    await seedCourses();
    await seedLectures();
    await seedFAQs();
    await enrollStudents();
    
    console.log('Database seeding completed successfully!');
    
    // Display summary
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const lectureCount = await Lecture.countDocuments();
    const faqCount = await FAQ.countDocuments();
    
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Users: ${userCount}`);
    console.log(`Courses: ${courseCount}`);
    console.log(`Lectures: ${lectureCount}`);
    console.log(`FAQs: ${faqCount}`);
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin: admin@smartclassroom.com / admin123');
    console.log('Teacher: sarah.johnson@smartclassroom.com / teacher123');
    console.log('Student: ram.kumar@smartclassroom.com / student123');
    
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
