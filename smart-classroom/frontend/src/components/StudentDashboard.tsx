import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  BookOpen, 
  LogOut, 
  Video, 
  Download, 
  UserCheck, 
  FileText, 
  Trophy,
  Calendar,
  HelpCircle,
  Wifi
} from 'lucide-react';
import { DoubtSection } from './DoubtSection';
import logo from 'figma:asset/536d06ad21a8e02a9e7ba08441091972abdd6fab.png';

interface StudentDashboardProps {
  onLogout: () => void;
}

export function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'attendance' | 'quiz' | 'marks'>('overview');
  const [showDoubtSection, setShowDoubtSection] = useState(false);

  const upcomingClasses = [
    { subject: 'Mathematics', time: '10:00 AM', instructor: 'Mr. Rajesh Sharma', room: 'Room A' },
    { subject: 'Science', time: '2:00 PM', instructor: 'Mrs. Sunita Devi', room: 'Room B' },
    { subject: 'Social Science', time: '4:00 PM', instructor: 'Mr. Ram Kumar', room: 'Room C' }
  ];

  const recentLectures = [
    { subject: 'Mathematics', title: 'Basic Principles of Algebra', date: '2 days ago', size: '15 MB' },
    { subject: 'Science', title: 'Light and Sound', date: '3 days ago', size: '12 MB' },
    { subject: 'English', title: 'Grammar Basics', date: '5 days ago', size: '8 MB' }
  ];

  const attendanceData = [
    { subject: 'Mathematics', present: 18, total: 20, percentage: 90 },
    { subject: 'Science', present: 16, total: 18, percentage: 89 },
    { subject: 'English', present: 15, total: 17, percentage: 88 },
    { subject: 'Social Science', present: 14, total: 16, percentage: 87 }
  ];

  const quizScores = [
    { subject: 'Mathematics', quiz: 'Quiz 1', score: 8, total: 10, percentage: 80 },
    { subject: 'Mathematics', quiz: 'Quiz 2', score: 9, total: 10, percentage: 90 },
    { subject: 'Science', quiz: 'Quiz 1', score: 7, total: 10, percentage: 70 },
    { subject: 'English', quiz: 'Quiz 1', score: 9, total: 10, percentage: 90 }
  ];

  const examMarks = [
    { subject: 'Mathematics', exam: 'Test 1', score: 78, total: 100, percentage: 78 },
    { subject: 'Science', exam: 'Test 1', score: 82, total: 100, percentage: 82 },
    { subject: 'English', exam: 'Test 1', score: 85, total: 100, percentage: 85 },
    { subject: 'Social Science', exam: 'Test 1', score: 79, total: 100, percentage: 79 }
  ];

  if (showDoubtSection) {
    return <DoubtSection onClose={() => setShowDoubtSection(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">


      <div className="flex pt-2">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            {/* Network Status */}
            <div className="mb-6 bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-success">Network Status</p>
                  <p className="text-xs text-muted-foreground">2G Ready - 35 KB/s</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 mb-6">
              <Button className="w-full bg-primary text-white py-3 rounded-lg">
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
              
              <Button className="w-full bg-success text-white py-3 rounded-lg">
                <Download className="h-4 w-4 mr-2" />
                Download Lectures
              </Button>
            </div>

            <Separator className="my-4" />

            {/* Navigation Menu */}
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
                { id: 'attendance', label: 'Attendance', icon: <UserCheck className="h-4 w-4" /> },
                { id: 'quiz', label: 'Quiz Scores', icon: <FileText className="h-4 w-4" /> },
                { id: 'marks', label: 'Exam Marks', icon: <Trophy className="h-4 w-4" /> }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeSection === item.id
                      ? 'bg-primary text-white'
                      : 'text-primary hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="mt-6 bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-primary mb-2">Today's Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Classes Today:</span>
                  <span className="font-medium text-accent">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Attendance:</span>
                  <span className="font-medium text-success">89%</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Used:</span>
                  <span className="font-medium text-primary">25 MB</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl text-primary font-medium">Overview</h2>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Today, September 11, 2024</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-lg border">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Join Meeting</h3>
                    <p className="text-muted-foreground mb-4">Connect to your live classes</p>
                    <Button className="w-full bg-primary text-white">Join Now</Button>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-success rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Download Lectures</h3>
                    <p className="text-muted-foreground mb-4">Access previous recordings</p>
                    <Button variant="outline" className="w-full">Browse</Button>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Schedule */}
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Today's Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingClasses.map((class_, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{class_.subject}</h3>
                            <p className="text-sm text-muted-foreground">{class_.instructor} • {class_.room}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{class_.time}</p>
                          <Button size="sm" variant="outline" className="mt-1">
                            Join
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Lectures */}
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Recent Lectures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentLectures.map((lecture, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{lecture.title}</h3>
                            <p className="text-sm text-muted-foreground">{lecture.subject} • {lecture.size}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{lecture.date}</p>
                          <Button size="sm" variant="outline" className="mt-1">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Attendance Section */}
          {activeSection === 'attendance' && (
            <div className="space-y-6">
              <h2 className="text-2xl text-primary font-medium">Attendance Record</h2>
              
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Subject-wise Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceData.map((attendance, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{attendance.subject}</h3>
                          <Badge variant={attendance.percentage >= 85 ? "default" : "destructive"}>
                            {attendance.percentage}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <span>Present: {attendance.present}/{attendance.total} classes</span>
                          <span>{attendance.total - attendance.present} absent</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              attendance.percentage >= 85 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${attendance.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quiz Scores Section */}
          {activeSection === 'quiz' && (
            <div className="space-y-6">
              <h2 className="text-2xl text-primary font-medium">Quiz Scores</h2>
              
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Quiz Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quizScores.map((quiz, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{quiz.subject}</h3>
                            <p className="text-sm text-muted-foreground">{quiz.quiz}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium">{quiz.score}/{quiz.total}</p>
                            <Badge variant={quiz.percentage >= 80 ? "default" : quiz.percentage >= 60 ? "secondary" : "destructive"}>
                              {quiz.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              quiz.percentage >= 80 ? 'bg-green-500' : 
                              quiz.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${quiz.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Exam Marks Section */}
          {activeSection === 'marks' && (
            <div className="space-y-6">
              <h2 className="text-2xl text-primary font-medium">Exam Marks</h2>
              
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Test Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {examMarks.map((mark, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{mark.subject}</h3>
                            <p className="text-sm text-muted-foreground">{mark.exam}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium">{mark.score}/{mark.total}</p>
                            <Badge variant={mark.percentage >= 80 ? "default" : mark.percentage >= 60 ? "secondary" : "destructive"}>
                              {mark.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              mark.percentage >= 80 ? 'bg-green-500' : 
                              mark.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${mark.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Help Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setShowDoubtSection(true)}
          className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}