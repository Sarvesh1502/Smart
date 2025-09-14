import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    // Header
    'header.title': 'Vidya Vahini',
    'header.subtitle': 'Government of Rajasthan',
    'header.login': 'Login',
    'header.logout': 'Logout',
    'header.backToHome': 'Back to Home',
    'header.welcome': 'Welcome',
    
    // Landing Page
    'landing.hero.title': 'Quality Education for Rural Rajasthan',
    'landing.hero.subtitle': 'Connecting urban teachers with rural students through low-bandwidth technology',
    'landing.hero.getStarted': 'Get Started',
    'landing.hero.learnMore': 'Learn More',
    
    'landing.features.title': 'Platform Features',
    'landing.features.lowBandwidth': 'Low Bandwidth Optimized',
    'landing.features.lowBandwidthDesc': 'Works perfectly on 25-50 KB/s connections',
    'landing.features.freeEducation': 'Free Education',
    'landing.features.freeEducationDesc': 'Completely free government initiative',
    'landing.features.expertTeachers': 'Expert Teachers',
    'landing.features.expertTeachersDesc': 'Qualified urban teachers for rural students',
    'landing.features.ruralFocus': 'Rural Focused',
    'landing.features.ruralFocusDesc': 'Designed specifically for rural communities',
    
    'landing.roles.title': 'Three Access Levels',
    'landing.roles.student': 'Student Access',
    'landing.roles.studentDesc': 'Access courses, submit assignments, join virtual classes',
    'landing.roles.faculty': 'Faculty Access',
    'landing.roles.facultyDesc': 'Create content, manage classes, track student progress',
    'landing.roles.admin': 'Admin Access',
    'landing.roles.adminDesc': 'Platform management, user oversight, system analytics',
    
    'landing.government.title': 'Government Initiative',
    'landing.government.free': 'FREE',
    'landing.government.desc': 'This is a Government of Rajasthan initiative providing completely free education to rural communities.',
    'landing.government.commitment': 'Our commitment to bridging the digital education gap in rural areas.',
    
    // Auth Page
    'auth.title': 'Access Vidya Vahini',
    'auth.subtitle': 'Government of Rajasthan Education Platform',
    'auth.selectRole': 'Select Your Role',
    'auth.student': 'Student',
    'auth.faculty': 'Faculty', 
    'auth.admin': 'Administrator',
    'auth.loginAs': 'Login as',
    
    // Roles
    'role.admin': 'Administrator',
    'role.faculty': 'Faculty',
    'role.student': 'Student',
    
    // Dashboard Common
    'dashboard.overview': 'Overview',
    'dashboard.courses': 'Courses',
    'dashboard.assignments': 'Assignments',
    'dashboard.announcements': 'Announcements',
    'dashboard.profile': 'Profile',
    'dashboard.settings': 'Settings',
    
    // Student Dashboard
    'student.myCourses': 'My Courses',
    'student.activeAssignments': 'Active Assignments',
    'student.recentAnnouncements': 'Recent Announcements',
    'student.quickActions': 'Quick Actions',
    'student.joinLiveClass': 'Join Live Class',
    'student.submitAssignment': 'Submit Assignment',
    'student.askDoubt': 'Ask a Doubt',
    'student.downloadMaterials': 'Download Materials',
    'student.enrolled': 'Enrolled',
    'student.assignments': 'assignments',
    'student.due': 'Due',
    'student.submitted': 'Submitted',
    'student.pending': 'Pending',
    'student.viewDetails': 'View Details',
    'student.startLearning': 'Start Learning',
    'student.continueWatching': 'Continue Watching',
    'student.completed': 'Completed',
    
    // Faculty Dashboard
    'faculty.myClasses': 'My Classes',
    'faculty.studentProgress': 'Student Progress',
    'faculty.pendingReviews': 'Pending Reviews',
    'faculty.createContent': 'Create Content',
    'faculty.scheduleClass': 'Schedule Class',
    'faculty.reviewAssignments': 'Review Assignments',
    'faculty.sendAnnouncement': 'Send Announcement',
    'faculty.students': 'students',
    'faculty.submissions': 'submissions',
    'faculty.avgScore': 'Avg Score',
    'faculty.attendance': 'Attendance',
    'faculty.progress': 'Progress',
    'faculty.viewClass': 'View Class',
    'faculty.gradeSubmissions': 'Grade Submissions',
    
    // Admin Dashboard
    'admin.platformOverview': 'Platform Overview',
    'admin.userManagement': 'User Management',
    'admin.systemHealth': 'System Health',
    'admin.quickActions': 'Quick Actions',
    'admin.addUser': 'Add New User',
    'admin.generateReport': 'Generate Report',
    'admin.systemMaintenance': 'System Maintenance',
    'admin.backupData': 'Backup Data',
    'admin.totalUsers': 'Total Users',
    'admin.activeClasses': 'Active Classes',
    'admin.dataUsage': 'Data Usage',
    'admin.systemUptime': 'System Uptime',
    'admin.students': 'Students',
    'admin.faculty': 'Faculty',
    'admin.admins': 'Admins',
    'admin.manageUsers': 'Manage Users',
    'admin.viewReports': 'View Reports',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.download': 'Download',
    'common.upload': 'Upload',
  },
  hi: {
    // Header  
    'header.title': 'विद्या वाहिनी',
    'header.subtitle': 'राजस्थान सरकार',
    'header.login': 'लॉगिन',
    'header.logout': 'लॉगआउट',
    'header.backToHome': 'मुख्य पृष्ठ पर वापस',
    'header.welcome': 'स्वागत',
    
    // Landing Page
    'landing.hero.title': 'ग्रामीण राजस्थान के लिए गुणवत्तापूर्ण शिक्षा',
    'landing.hero.subtitle': 'कम बैंडविड्थ तकनीक के माध्यम से शहरी शिक्षकों को ग्रामीण छात्रों से जोड़ना',
    'landing.hero.getStarted': 'शुरू करें',
    'landing.hero.learnMore': 'और जानें',
    
    'landing.features.title': 'प्लेटफॉर्म विशेषताएं',
    'landing.features.lowBandwidth': 'कम बैंडविड्थ अनुकूलित',
    'landing.features.lowBandwidthDesc': '25-50 KB/s कनेक्शन पर बेहतरीन काम करता है',
    'landing.features.freeEducation': 'निःशुल्क शिक्षा',
    'landing.features.freeEducationDesc': 'पूर्णतः निःशुल्क सरकारी पहल',
    'landing.features.expertTeachers': 'विशेषज्ञ शिक्षक',
    'landing.features.expertTeachersDesc': 'ग्रामीण छात्रों के लिए योग्य शहरी शिक्षक',
    'landing.features.ruralFocus': 'ग्रामीण केंद्रित',
    'landing.features.ruralFocusDesc': 'विशेष रूप से ग्रामीण समुदायों के लिए डिज़ाइन',
    
    'landing.roles.title': 'तीन पहुंच स्तर',
    'landing.roles.student': 'छात्र पहुंच',
    'landing.roles.studentDesc': 'पाठ्यक्रम एक्सेस करें, असाइनमेंट जमा करें, वर्चुअल क्लासेस में शामिल हों',
    'landing.roles.faculty': 'संकाय पहुंच',
    'landing.roles.facultyDesc': 'सामग्री बनाएं, कक्षाओं का प्रबंधन करें, छात्र प्रगति ट्रैक करें',
    'landing.roles.admin': 'प्रशासक पहुंच',
    'landing.roles.adminDesc': 'प्लेटफॉर्म प्रबंधन, उपयोगकर्ता निरीक्षण, सिस्टम एनालिटिक्स',
    
    'landing.government.title': 'सरकारी पहल',
    'landing.government.free': 'निःशुल्क',
    'landing.government.desc': 'यह राजस्थान सरकार की एक पहल है जो ग्रामीण समुदायों को पूर्णतः निःशुल्क शिक्षा प्रदान करती है।',
    'landing.government.commitment': 'ग्रामीण क्षेत्रों में डिजिटल शिक्षा की खाई को पाटने की हमारी प्रतिबद्धता।',
    
    // Auth Page
    'auth.title': 'विद्या वाहिनी तक पहुंच',
    'auth.subtitle': 'राजस्थान सरकार शिक्षा प्लेटफॉर्म',
    'auth.selectRole': 'अपनी भूमिका चुनें',
    'auth.student': 'छात्र',
    'auth.faculty': 'संकाय',
    'auth.admin': 'प्रशासक',
    'auth.loginAs': 'के रूप में लॉगिन करें',
    
    // Roles
    'role.admin': 'प्रशासक',
    'role.faculty': 'संकाय',
    'role.student': 'छात्र',
    
    // Dashboard Common
    'dashboard.overview': 'अवलोकन',
    'dashboard.courses': 'पाठ्यक्रम',
    'dashboard.assignments': 'असाइनमेंट',
    'dashboard.announcements': 'घोषणाएं',
    'dashboard.profile': 'प्रोफाइल',
    'dashboard.settings': 'सेटिंग्स',
    
    // Student Dashboard
    'student.myCourses': 'मेरे पाठ्यक्रम',
    'student.activeAssignments': 'सक्रिय असाइनमेंट',
    'student.recentAnnouncements': 'हाल की घोषणाएं',
    'student.quickActions': 'त्वरित कार्य',
    'student.joinLiveClass': 'लाइव क्लास में शामिल हों',
    'student.submitAssignment': 'असाइनमेंट जमा करें',
    'student.askDoubt': 'संदेह पूछें',
    'student.downloadMaterials': 'सामग्री डाउनलोड करें',
    'student.enrolled': 'नामांकित',
    'student.assignments': 'असाइनमेंट',
    'student.due': 'देय',
    'student.submitted': 'जमा किया गया',
    'student.pending': 'लंबित',
    'student.viewDetails': 'विवरण देखें',
    'student.startLearning': 'सीखना शुरू करें',
    'student.continueWatching': 'देखना जारी रखें',
    'student.completed': 'पूर्ण',
    
    // Faculty Dashboard
    'faculty.myClasses': 'मेरी कक्षाएं',
    'faculty.studentProgress': 'छात्र प्रगति',
    'faculty.pendingReviews': 'लंबित समीक्षाएं',
    'faculty.createContent': 'सामग्री बनाएं',
    'faculty.scheduleClass': 'कक्षा निर्धारित करें',
    'faculty.reviewAssignments': 'असाइनमेंट समीक्षा करें',
    'faculty.sendAnnouncement': 'घोषणा भेजें',
    'faculty.students': 'छात्र',
    'faculty.submissions': 'प्रस्तुतियां',
    'faculty.avgScore': 'औसत स्कोर',
    'faculty.attendance': 'उपस्थिति',
    'faculty.progress': 'प्रगति',
    'faculty.viewClass': 'कक्षा देखें',
    'faculty.gradeSubmissions': 'ग्रेड प्रस्तुतियां',
    
    // Admin Dashboard
    'admin.platformOverview': 'प्लेटफॉर्म अवलोकन',
    'admin.userManagement': 'उपयोगकर्ता प्रबंधन',
    'admin.systemHealth': 'सिस्टम स्वास्थ्य',
    'admin.quickActions': 'त्वरित कार्य',
    'admin.addUser': 'नया उपयोगकर्ता जोड़ें',
    'admin.generateReport': 'रिपोर्ट जेनरेट करें',
    'admin.systemMaintenance': 'सिस्टम रखरखाव',
    'admin.backupData': 'डेटा बैकअप',
    'admin.totalUsers': 'कुल उपयोगकर्ता',
    'admin.activeClasses': 'सक्रिय कक्षाएं',
    'admin.dataUsage': 'डेटा उपयोग',
    'admin.systemUptime': 'सिस्टम अपटाइम',
    'admin.students': 'छात्र',
    'admin.faculty': 'संकाय',
    'admin.admins': 'प्रशासक',
    'admin.manageUsers': 'उपयोगकर्ता प्रबंधन',
    'admin.viewReports': 'रिपोर्ट देखें',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.save': 'सेव करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.view': 'देखें',
    'common.download': 'डाउनलोड',
    'common.upload': 'अपलोड',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}