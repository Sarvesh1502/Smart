import React from 'react';
import { Button } from './ui/button';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="border-gray-300 text-muted-foreground hover:bg-gray-50 min-w-[80px]"
    >
      <Languages className="h-4 w-4 mr-2" />
      {language === 'en' ? 'हिं' : 'EN'}
    </Button>
  );
}