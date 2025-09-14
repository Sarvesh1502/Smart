import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  UserCog, 
  LogOut, 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Library, 
  Settings,
  BarChart3,
  GraduationCap
} from 'lucide-react';
import logo from 'figma:asset/536d06ad21a8e02a9e7ba08441091972abdd6fab.png';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'students' | 'library'>('overview');

  const stats = [
    { label: 'Total Students', value: '2,847', icon: <Users className="h-5 w-5" />, color: 'bg-primary' },
    { label: 'Active Faculty', value: '156', icon: <GraduationCap className="h-5 w-5" />, color: 'bg-success' },
    { label: 'Courses Available', value: '89', icon: <Library className="h-5 w-5" />, color: 'bg-accent' },
    { label: 'System Uptime', value: '99.9%', icon: <BarChart3 className="h-5 w-5" />, color: 'bg-secondary' }
  ];

  return (
    <div className="min-h-screen bg-background">


      <div className="max-w-6xl mx-auto px-4 py-6 pt-4">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'students', label: 'Student Management', icon: <Users className="h-4 w-4" /> },
            { id: 'library', label: 'Library Access', icon: <Library className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                activeSection === tab.id
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="rounded-lg border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-medium">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <Card className="rounded-lg border">
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { action: 'New student registered', user: 'John Smith', time: '2 minutes ago' },
                  { action: 'Faculty uploaded new lecture', user: 'Dr. Sarah Johnson', time: '15 minutes ago' },
                  { action: 'System backup completed', user: 'System', time: '1 hour ago' },
                  { action: 'Library resource updated', user: 'Admin', time: '3 hours ago' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">by {activity.user}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student Management Section */}
        {activeSection === 'students' && (
          <div className="space-y-6">
            <h2 className="text-2xl text-primary font-medium">Student Management</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Student Access</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button className="w-full bg-primary text-white py-3 rounded-lg justify-start">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register New Student
                    </Button>
                    <Button variant="outline" className="w-full py-3 rounded-lg justify-start">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Update Student Info
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm" className="rounded-lg">
                        View All Students
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg">
                        Export Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Student Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Total Enrolled</span>
                      <Badge className="bg-primary text-white">2,847</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active This Month</span>
                      <Badge className="bg-success text-white">2,654</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New Registrations</span>
                      <Badge className="bg-accent text-white">89</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Graduation Pending</span>
                      <Badge className="bg-secondary text-primary">156</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Library Access Section */}
        {activeSection === 'library' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-primary font-medium">Library Management</h2>
              <Button className="bg-primary text-white rounded-lg">
                <Library className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Digital Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>E-Books</span>
                      <Badge className="bg-primary text-white">1,245</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Research Papers</span>
                      <Badge className="bg-success text-white">3,567</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Video Lectures</span>
                      <Badge className="bg-accent text-white">892</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-lg">
                    Manage Resources
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>Access Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Daily Views</span>
                      <Badge className="bg-primary text-white">12,456</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Downloads Today</span>
                      <Badge className="bg-success text-white">1,234</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Popular Category</span>
                      <Badge className="bg-accent text-white">Science</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-lg">
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start rounded-lg">
                      <Settings className="h-4 w-4 mr-2" />
                      General Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start rounded-lg">
                      <Users className="h-4 w-4 mr-2" />
                      User Permissions
                    </Button>
                    <Button variant="outline" className="w-full justify-start rounded-lg">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      System Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}