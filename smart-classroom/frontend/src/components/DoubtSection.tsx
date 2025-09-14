import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  X, 
  Send, 
  Search, 
  Filter,
  MessageCircle,
  Bot,
  User,
  Clock,
  BookOpen,
  HelpCircle
} from 'lucide-react';

interface DoubtSectionProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface Doubt {
  id: string;
  title: string;
  content: string;
  subject: string;
  semester: string;
  author: string;
  timestamp: Date;
  replies: number;
  resolved: boolean;
}

export function DoubtSection({ onClose }: DoubtSectionProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AI study assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const previousDoubts: Doubt[] = [
    {
      id: '1',
      title: 'Understanding Binary Search Algorithm',
      content: 'Can someone explain how binary search works with an example?',
      subject: 'Algorithms',
      semester: 'Semester 3',
      author: 'Alex Johnson',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      replies: 5,
      resolved: true
    },
    {
      id: '2',
      title: 'Difference between Stack and Queue',
      content: 'What are the main differences between stack and queue data structures?',
      subject: 'Data Structures',
      semester: 'Semester 2',
      author: 'Sarah Smith',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      replies: 3,
      resolved: false
    },
    {
      id: '3',
      title: 'Database Normalization Forms',
      content: 'Need help understanding 1NF, 2NF, and 3NF with practical examples.',
      subject: 'Database Systems',
      semester: 'Semester 4',
      author: 'Mike Chen',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      replies: 8,
      resolved: true
    },
    {
      id: '4',
      title: 'Object-Oriented Programming Concepts',
      content: 'Confused about inheritance and polymorphism. Can someone clarify?',
      subject: 'Computer Science 101',
      semester: 'Semester 1',
      author: 'Emily Davis',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      replies: 12,
      resolved: true
    },
    {
      id: '5',
      title: 'Time Complexity Analysis',
      content: 'How do I calculate the time complexity of recursive algorithms?',
      subject: 'Algorithms',
      semester: 'Semester 3',
      author: 'David Wilson',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      replies: 6,
      resolved: false
    }
  ];

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // Simulate AI response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateAIResponse(currentMessage),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const generateAIResponse = (question: string): string => {
    const responses = [
      "That's a great question! Let me help you understand this concept step by step...",
      "I can definitely help with that. Here's what you need to know...",
      "This is a common topic students ask about. Let me break it down for you...",
      "Good question! This concept is fundamental to understanding the subject...",
      "I'm here to help! Let me provide you with a clear explanation..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const filteredDoubts = previousDoubts.filter(doubt => {
    const matchesSearch = doubt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doubt.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester = !selectedSemester || doubt.semester === selectedSemester;
    const matchesSubject = !selectedSubject || doubt.subject === selectedSubject;
    
    return matchesSearch && matchesSemester && matchesSubject;
  });

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl">Doubt & Help Center</h1>
              <p className="text-sm text-muted-foreground">Get help from AI and community</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Main Content - VS Code Style Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - AI Chatbot */}
        <div className="w-1/2 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-medium">AI Study Assistant</h2>
                <p className="text-sm text-muted-foreground">Ask me anything about your studies</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    message.type === 'user' ? 'bg-primary' : 'bg-blue-500'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${
                    message.type === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                placeholder="Ask your question..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="rounded-lg"
              />
              <Button onClick={sendMessage} size="sm" className="rounded-lg">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Community Doubts */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-medium">Community Doubts</h2>
                  <p className="text-sm text-muted-foreground">Browse previous questions and answers</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search doubts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>

              <div className="flex space-x-2">
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Semesters</SelectItem>
                    <SelectItem value="Semester 1">Semester 1</SelectItem>
                    <SelectItem value="Semester 2">Semester 2</SelectItem>
                    <SelectItem value="Semester 3">Semester 3</SelectItem>
                    <SelectItem value="Semester 4">Semester 4</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subjects</SelectItem>
                    <SelectItem value="Computer Science 101">Computer Science 101</SelectItem>
                    <SelectItem value="Data Structures">Data Structures</SelectItem>
                    <SelectItem value="Algorithms">Algorithms</SelectItem>
                    <SelectItem value="Database Systems">Database Systems</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Doubts List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {filteredDoubts.map((doubt) => (
                <Card key={doubt.id} className="rounded-lg border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm line-clamp-1">{doubt.title}</h3>
                      <Badge 
                        variant={doubt.resolved ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {doubt.resolved ? 'Resolved' : 'Open'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {doubt.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {doubt.subject}
                        </Badge>
                        <span>•</span>
                        <span>{doubt.semester}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-3 w-3" />
                        <span>{doubt.replies}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(doubt.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">by {doubt.author}</span>
                      <Button size="sm" variant="outline" className="text-xs rounded-md">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredDoubts.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No doubts found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search criteria or ask a new question in the chat.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Ask New Question Button */}
          <div className="p-4 border-t border-border">
            <Button className="w-full rounded-lg py-3">
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask New Question
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}