import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LogOut, Users, UserCog, BookOpen } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole, Page } from '../App';
import logo from 'figma:asset/536d06ad21a8e02a9e7ba08441091972abdd6fab.png';

interface HeaderProps {
  userRole?: UserRole;
  userName?: string;
  onLogout?: () => void;
  currentPage?: Page;
  onNavigate?: (page: Page) => void;
}

export function Header({ userRole, userName, onLogout, currentPage, onNavigate }: HeaderProps) {
  const { t } = useLanguage();
  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          label: t('role.admin'),
          icon: <UserCog className="h-3 w-3 mr-1" />,
          bgColor: 'bg-warning'
        };
      case 'faculty':
        return {
          label: t('role.faculty'),
          icon: <Users className="h-3 w-3 mr-1" />,
          bgColor: 'bg-success'
        };
      case 'student':
        return {
          label: t('role.student'),
          icon: <BookOpen className="h-3 w-3 mr-1" />,
          bgColor: 'bg-primary'
        };
      default:
        return null;
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Government Branding */}
          <div className="flex items-center space-x-4">
            <img 
              src={logo} 
              alt="Vidya Vahini Logo" 
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-lg font-medium text-primary">{t('header.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('header.subtitle')}</p>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle - always visible */}
            <LanguageToggle />
            {/* Show user info only on dashboard */}
            {userRole && roleInfo && currentPage === 'dashboard' && (
              <>
                {userName && (
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-foreground">
                      {t('header.welcome')}, {userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {roleInfo.label}
                    </p>
                  </div>
                )}
                
                <Badge className="bg-secondary text-primary px-3 py-1">
                  {roleInfo.icon}
                  {roleInfo.label}
                </Badge>

                {onLogout && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onLogout}
                    className="border-gray-300 text-muted-foreground hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{t('header.logout')}</span>
                  </Button>
                )}
              </>
            )}

            {/* Show login button on landing page */}
            {currentPage === 'landing' && onNavigate && (
              <Button 
                onClick={() => onNavigate('auth')}
                className="bg-primary text-white px-6 py-2 rounded-lg"
              >
                {t('header.login')}
              </Button>
            )}

            {/* Show back to home on auth page */}
            {currentPage === 'auth' && onNavigate && (
              <Button 
                variant="outline"
                onClick={() => onNavigate('landing')}
                className="border-gray-300 text-muted-foreground hover:bg-gray-50"
              >
                {t('header.backToHome')}
              </Button>
            )}
          </div>
        </div>
      </div>


    </header>
  );
}