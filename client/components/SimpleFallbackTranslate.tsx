import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, ExternalLink } from 'lucide-react';

const SIMPLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', url: '' },
  { code: 'es', name: 'Español', flag: '🇪🇸', url: 'https://translate.google.com/translate?sl=en&tl=es&u=' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', url: 'https://translate.google.com/translate?sl=en&tl=fr&u=' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', url: 'https://translate.google.com/translate?sl=en&tl=hi&u=' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', url: 'https://translate.google.com/translate?sl=en&tl=de&u=' },
  { code: 'zh', name: '中文', flag: '🇨🇳', url: 'https://translate.google.com/translate?sl=en&tl=zh&u=' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', url: 'https://translate.google.com/translate?sl=en&tl=ar&u=' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', url: 'https://translate.google.com/translate?sl=en&tl=pt&u=' }
];

interface SimpleFallbackTranslateProps {
  className?: string;
}

export default function SimpleFallbackTranslate({ className = '' }: SimpleFallbackTranslateProps) {
  const [isOpen, setIsOpen] = useState(false);

  const translatePage = (language: typeof SIMPLE_LANGUAGES[0]) => {
    if (language.code === 'en') {
      // Reload page for English (original)
      window.location.reload();
      return;
    }

    // Open Google Translate with current page URL
    const currentUrl = encodeURIComponent(window.location.href);
    const translateUrl = language.url + currentUrl;
    window.open(translateUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4" />
        <span>Translate</span>
        <ExternalLink className="h-3 w-3" />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border rounded-lg shadow-lg z-50 w-64">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Quick Translate</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Opens Google Translate in new tab</p>
          </div>
          
          <div className="p-2">
            {SIMPLE_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => translatePage(language)}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-left transition-colors"
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {language.code === 'en' ? (
                  <span className="ml-auto text-xs text-gray-500">Original</span>
                ) : (
                  <ExternalLink className="ml-auto h-3 w-3 text-gray-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
