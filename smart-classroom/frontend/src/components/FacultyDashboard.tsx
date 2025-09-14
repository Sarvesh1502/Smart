import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Users, 
  LogOut, 
  Video, 
  Upload, 
  UserCheck, 
  FileText, 
  Trophy,
  Calendar,
  Clock,
  BookOpen
} from 'lucide-react';
import logo from 'figma:asset/536d06ad21a8e02a9e7ba08441091972abdd6fab.png';

interface FacultyDashboardProps {
  onLogout: () => void;
}

export function FacultyDashboard({ onLogout }: FacultyDashboardProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'upload' | 'attendance' | 'quiz' | 'marks'>('overview');

  const upcomingClasses = [
    { subject: 'Mathematics', time: '10:00 AM', students: 45, room: 'Virtual Room A' },
    { subject: 'Science', time: '2:00 PM', students: 38, room: 'Virtual Room B' },
    { subject: 'English', time: '4:00 PM', students: 42, room: 'Virtual Room C' }
  ];

  const recentActivity = [
    { action: 'Uploaded new lecture', subject: 'Mathematics', time: '2 hours ago' },
    { action: 'Marked attendance', subject: 'Science', time: '1 day ago' },
    { action: 'Updated quiz scores', subject: 'English', time: '2 days ago' }
  ];

  return (
    <div className="min-h-screen bg-background">


      <div className="flex pt-2">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            {/* Start Meeting Button */}
            <Button className="w-full mb-6 bg-primary text-white py-3 rounded-lg">
              <Video className="h-4 w-4 mr-2" />
              Start Meeting
            </Button>

            <Separator className="my-4" />

            {/* Navigation Menu */}
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
                { id: 'upload', label: 'Upload Lecture', icon: <Upload className="h-4 w-4" /> },
                { id: 'attendance', label: 'Mark Attendance', icon: <UserCheck className="h-4 w-4" /> },
                { id: 'quiz', label: 'Enter Quiz Scores', icon: <FileText className="h-4 w-4" /> },
                { id: 'marks', label: 'Exam Marks', icon: <Trophy className="h-4 w-4" /> }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeSection === item.id
                      ? 'bg-success text-white'
                      : 'text-success hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-lg border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Today's Classes</p>
                        <p className="text-2xl font-medium">3</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary text-white">
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Students</p>
                        <p className="text-2xl font-medium">125</p>
                      </div>
                      <div className="p-3 rounded-lg bg-success text-white">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Subjects</p>
                        <p className="text-2xl font-medium">4</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent text-white">
                        <BookOpen className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Schedule */}
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
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
                            <p className="text-sm text-muted-foreground">{class_.room} • {class_.students} students</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{class_.time}</p>
                          <Button size="sm" variant="outline" className="mt-1">
                            Join Class
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.subject}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upload Lecture Section */}
          {activeSection === 'upload' && (
            <div className="space-y-6">
              <h2 className="text-2xl text-primary font-medium">Upload Lecture</h2>
              
              <Card className="rounded-lg border max-w-2xl">
                <CardHeader>
                  <CardTitle>Upload New Lecture Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <select className="w-full p-3 border border-gray-200 rounded-lg bg-white">
                      <option>Mathematics</option>
                      <option>Science</option>
                      <option>English</option>
                      <option>Social Science</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Lecture Title</label>
                    <input 
                      type="text" 
                      placeholder="Enter lecture title"
                      className="w-full p-3 border border-gray-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Files</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                      <p className="text-sm text-gray-500">Support for video, PDF, PPT, and other formats</p>
                      <Button variant="outline" className="mt-4">
                        Choose Files
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea 
                      placeholder="Enter lecture description..."
                      rows={4}
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button className="flex-1 bg-success text-white py-3">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Lecture
                    </Button>
                    <Button variant="outline" className="flex-1 py-3">
                      Save as Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mark Attendance Section */}
          {activeSection === 'attendance' && (
            <div className="space-y-6">
              <h2 className="text-2xl text-primary font-medium">Mark Attendance</h2>
              
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Class Attendance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <select className="w-full p-3 border border-gray-200 rounded-lg bg-white">
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date</label>
                      <input 
                        type="date" 
                        className="w-full p-3 border border-gray-200 rounded-lg"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Student List</h3>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Mark All Present</Button>
                        <Button size="sm" variant="outline">Mark All Absent</Button>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {Array.from({ length: 45 }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{i + 1}</span>
                            </div>
                            <span>Student {i + 1}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                              Present
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                              Absent
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-success text-white py-3">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Save Attendance
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quiz Scores Section */}
          {activeSection === 'quiz' && (
            <div className="space-y-6">
              <h2 className="text-2xl text-primary font-medium">Enter Quiz Scores</h2>
              
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Quiz Score Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <select className="w-full p-3 border border-gray-200 rounded-lg bg-white">
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Quiz Number</label>
                      <select className="w-full p-3 border border-gray-200 rounded-lg bg-white">
                        <option>Quiz 1</option>
                        <option>Quiz 2</option>
                        <option>Quiz 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Score</label>
                      <input 
                        type="number" 
                        placeholder="10"
                        className="w-full p-3 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Student Scores</h3>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {Array.from({ length: 45 }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{i + 1}</span>
                            </div>
                            <span>Student {i + 1}</span>
                          </div>
                          <input 
                            type="number" 
                            placeholder="Score"
                            className="w-20 p-2 border border-gray-200 rounded text-center"
                            min="0"
                            max="10"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-success text-white py-3">
                    <FileText className="h-4 w-4 mr-2" />
                    Save Quiz Scores
                  </Button>
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
                  <CardTitle>Test Marks Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <select className="w-full p-3 border border-gray-200 rounded-lg bg-white">
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Exam Type</label>
                      <select className="w-full p-3 border border-gray-200 rounded-lg bg-white">
                        <option>Test 1</option>
                        <option>Test 2</option>
                        <option>Test 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Marks</label>
                      <input 
                        type="number" 
                        placeholder="100"
                        className="w-full p-3 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Student Marks</h3>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {Array.from({ length: 45 }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{i + 1}</span>
                            </div>
                            <span>Student {i + 1}</span>
                          </div>
                          <input 
                            type="number" 
                            placeholder="Marks"
                            className="w-24 p-2 border border-gray-200 rounded text-center"
                            min="0"
                            max="100"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-success text-white py-3">
                    <Trophy className="h-4 w-4 mr-2" />
                    Save Exam Marks
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}