import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { GraduationCap, Users, MapPin, Wifi, BookOpen, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Page } from '../App';
import logo from 'figma:asset/536d06ad21a8e02a9e7ba08441091972abdd6fab.png';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { t } = useLanguage();
  const stats = [
    {
      icon: <Users className="h-6 w-6 text-white" />,
      title: "Rural Students",
      value: "25,000+",
      color: "bg-accent"
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      title: "Teachers",
      value: "2,500+", 
      color: "bg-secondary"
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      title: "Villages",
      value: "500+",
      color: "bg-primary"
    },
    {
      icon: <Wifi className="h-6 w-6 text-white" />,
      title: "Low Bandwidth Ready",
      value: "25-50 KB/s",
      color: "bg-success"
    }
  ];

  return (
    <div className="min-h-screen bg-background">


      {/* Hero Section */}
      <section className="py-20 px-4 pt-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl text-primary font-medium">
              {t('landing.hero.title')}
            </h1>
            <p className="text-xl text-foreground max-w-3xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-success text-white px-4 py-2">
              <Wifi className="h-4 w-4 mr-2" />
              25-50 KB/s Ready
            </Badge>
            <Badge className="bg-accent text-white px-4 py-2">
              <Heart className="h-4 w-4 mr-2" />
              100% Free
            </Badge>
            <Badge className="bg-primary text-white px-4 py-2">
              <BookOpen className="h-4 w-4 mr-2" />
              RBSE Aligned
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-primary text-white px-8 py-3 rounded-lg"
              onClick={() => onNavigate('auth')}
            >
              {t('landing.hero.getStarted')}
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-accent text-accent px-8 py-3 rounded-lg"
              onClick={() => onNavigate('auth')}
            >
              {t('header.login')}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-primary font-medium mb-4">
              Our Impact
            </h2>
            <p className="text-lg text-foreground">
              Transforming rural education across Rajasthan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="rounded-lg border shadow-sm">
                <CardContent className="p-0">
                  <div className={`${stat.color} p-6 text-center`}>
                    <div className="flex justify-center mb-3">
                      {stat.icon}
                    </div>
                    <h3 className="text-2xl font-medium text-white mb-1">{stat.value}</h3>
                  </div>
                  <div className="p-4 bg-white text-center">
                    <h4 className="font-medium text-primary">{stat.title}</h4>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Government Initiative Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl text-primary font-medium">
            Government of Rajasthan Initiative
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-lg border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🏛️</div>
                <h3 className="text-xl font-medium text-primary mb-3">
                  100% Free Service
                </h3>
                <p className="text-foreground">
                  No fees, no charges. Completely funded by Government of Rajasthan.
                </p>
              </CardContent>
            </Card>
            
            <Card className="rounded-lg border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🌾</div>
                <h3 className="text-xl font-medium text-primary mb-3">
                  Rural First Design
                </h3>
                <p className="text-foreground">
                  Built specifically for 25-50 KB/s internet in remote villages.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-medium text-primary mb-4">
              Aligned with National Education Policy 2020
            </h3>
            <p className="text-lg text-foreground mb-6">
              Supporting equity, inclusion, and quality education for all children 
              in rural and underserved areas of Rajasthan.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="bg-primary text-white px-4 py-2">
                Equity & Inclusion
              </Badge>
              <Badge className="bg-accent text-white px-4 py-2">
                Technology Integration
              </Badge>
              <Badge className="bg-success text-white px-4 py-2">
                Quality Education
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-primary text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={logo} 
                  alt="Vidya Vahini Logo" 
                  className="w-10 h-10"
                />
                <div>
                  <h3 className="text-lg font-medium">Vidya Vahini</h3>
                  <p className="text-white/80 text-sm">Government of Rajasthan</p>
                </div>
              </div>
              <p className="text-white/90">
                Free quality education for every village in Rajasthan.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-secondary">Quick Links</h4>
              <div className="space-y-2">
                <button 
                  className="block text-white/90 text-left"
                  onClick={() => onNavigate('auth')}
                >
                  Student Login
                </button>
                <button 
                  className="block text-white/90 text-left"
                  onClick={() => onNavigate('auth')}
                >
                  Teacher Login
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-secondary">Contact</h4>
              <div className="space-y-2 text-white/90 text-sm">
                <p>help@vidyavahini.rajasthan.gov.in</p>
                <p>Jaipur, Rajasthan</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <p className="text-white/70">
              © 2024 Vidya Vahini - Government of Rajasthan. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}