import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ArrowLeft, GraduationCap, Users, BookOpen, UserCog, Wifi } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole } from '../App';
import logo from 'figma:asset/536d06ad21a8e02a9e7ba08441091972abdd6fab.png';

interface AuthPageProps {
  onAuth: (role: UserRole) => void;
  onBack: () => void;
}

export function AuthPage({ onAuth, onBack }: AuthPageProps) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const roles = [
    {
      value: 'admin' as const,
      label: t('auth.admin'),
      description: t('landing.roles.adminDesc'),
      icon: <UserCog className="h-6 w-6 text-white" />,
      color: 'bg-primary'
    },
    {
      value: 'faculty' as const,
      label: t('auth.faculty'),
      description: t('landing.roles.facultyDesc'),
      icon: <Users className="h-6 w-6 text-white" />,
      color: 'bg-success'
    },
    {
      value: 'student' as const,
      label: t('auth.student'),
      description: t('landing.roles.studentDesc'),
      icon: <BookOpen className="h-6 w-6 text-white" />,
      color: 'bg-accent'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole && formData.email && formData.password) {
      onAuth(selectedRole);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 pt-4">

          <div className="flex flex-col items-center space-y-4">
            <img 
              src={logo} 
              alt="Vidya Vahini Logo" 
              className="w-16 h-16"
            />
            <div>
              <h1 className="text-2xl text-primary font-medium">Vidya Vahini</h1>
              <p className="text-muted-foreground">Login to your account</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <Badge className="bg-success text-white px-3 py-1">
              <Wifi className="h-3 w-3 mr-1" />
              Works on 25-50 KB/s
            </Badge>
          </div>
        </div>

        <Card className="rounded-lg border shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-primary">
              Access Your Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="font-medium text-primary">Select Your Role</Label>
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setSelectedRole(role.value)}
                          className={`w-full p-3 rounded-lg border-2 text-left ${
                            selectedRole === role.value
                              ? 'border-primary bg-gray-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`${role.color} p-2 rounded-lg`}>
                              {role.icon}
                            </div>
                            <div>
                              <h3 className="font-medium text-primary">{role.label}</h3>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-white py-3 rounded-lg"
                    disabled={!selectedRole || !formData.email || !formData.password}
                  >
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="font-medium text-primary">Select Your Role</Label>
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setSelectedRole(role.value)}
                          className={`w-full p-3 rounded-lg border-2 text-left ${
                            selectedRole === role.value
                              ? 'border-primary bg-gray-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`${role.color} p-2 rounded-lg`}>
                              {role.icon}
                            </div>
                            <div>
                              <h3 className="font-medium text-primary">{role.label}</h3>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-register">Email Address</Label>
                    <Input
                      id="email-register"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-register">Password</Label>
                    <Input
                      id="password-register"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-accent text-white py-3 rounded-lg"
                    disabled={!selectedRole || !formData.email || !formData.password || !formData.name}
                  >
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              By continuing you agree to our Terms & Conditions and Privacy Policy
            </p>
            <div className="flex justify-center mt-2 space-x-2">
              <Badge className="bg-success text-white px-3 py-1 text-xs">
                100% Safe
              </Badge>
              <Badge className="bg-primary text-white px-3 py-1 text-xs">
                Government Platform
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}