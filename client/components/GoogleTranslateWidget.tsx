import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Languages } from 'lucide-react';

// Extended language support with Google Translate
const GOOGLE_TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' }
];

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

interface GoogleTranslateWidgetProps {
  variant?: 'dropdown' | 'button' | 'inline';
  className?: string;
}

export default function GoogleTranslateWidget({ 
  variant = 'dropdown',
  className = '' 
}: GoogleTranslateWidgetProps) {
  const translateElementRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load Google Translate script
    const loadGoogleTranslate = () => {
      if (window.google?.translate) {
        initializeTranslate();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;

      // Initialize function
      window.googleTranslateElementInit = () => {
        initializeTranslate();
      };

      document.head.appendChild(script);
    };

    const initializeTranslate = () => {
      if (translateElementRef.current && window.google?.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: GOOGLE_TRANSLATE_LANGUAGES.map(lang => lang.code).join(','),
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        }, translateElementRef.current);
        
        setIsLoaded(true);
        
        // Hide the default Google Translate widget
        setTimeout(() => {
          const goog = document.querySelector('.goog-te-gadget');
          if (goog) {
            (goog as HTMLElement).style.display = 'none';
          }
        }, 100);
      }
    };

    loadGoogleTranslate();

    return () => {
      // Cleanup
      const script = document.querySelector('script[src*="translate.google.com"]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  const changeLanguage = (langCode: string) => {
    if (!window.google?.translate) return;

    // Find the Google Translate select element
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectElement) {
      selectElement.value = langCode;
      selectElement.dispatchEvent(new Event('change'));
      setCurrentLanguage(langCode);
      setIsOpen(false);
      
      // Show notification
      showLanguageNotification(langCode);
    }
  };

  const showLanguageNotification = (langCode: string) => {
    const language = GOOGLE_TRANSLATE_LANGUAGES.find(lang => lang.code === langCode);
    if (!language) return;

    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
    notification.textContent = `Language: ${language.name}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  };

  const getCurrentLanguageInfo = () => {
    return GOOGLE_TRANSLATE_LANGUAGES.find(lang => lang.code === currentLanguage) || GOOGLE_TRANSLATE_LANGUAGES[0];
  };

  if (variant === 'button') {
    return (
      <div className={`google-translate-widget ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
          disabled={!isLoaded}
        >
          <Globe className="h-4 w-4" />
          {getCurrentLanguageInfo().flag}
          <span className="hidden sm:inline">{getCurrentLanguageInfo().name}</span>
        </Button>
        
        {isOpen && isLoaded && (
          <div className="absolute top-full mt-2 bg-white border rounded-lg shadow-lg z-50 p-2">
            <div className="grid grid-cols-2 gap-1 max-h-80 overflow-y-auto">
              {GOOGLE_TRANSLATE_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-left ${
                    currentLanguage === language.code ? 'bg-blue-50' : ''
                  }`}
                >
                  <span>{language.flag}</span>
                  <span className="text-sm">{language.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Hidden Google Translate element */}
        <div ref={translateElementRef} style={{ display: 'none' }}></div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`google-translate-widget ${className}`}>
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <Languages className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-600">Translate:</span>
          {isLoaded ? (
            <div className="flex gap-1">
              {GOOGLE_TRANSLATE_LANGUAGES.slice(0, 6).map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    currentLanguage === language.code 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  title={language.name}
                >
                  {language.flag}
                </button>
              ))}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-2 py-1 text-xs bg-white hover:bg-gray-100 rounded"
              >
                +{GOOGLE_TRANSLATE_LANGUAGES.length - 6}
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Loading...</span>
          )}
        </div>
        
        {isOpen && (
          <div className="mt-2 bg-white border rounded-lg shadow-lg p-2">
            <div className="grid grid-cols-3 gap-1">
              {GOOGLE_TRANSLATE_LANGUAGES.slice(6).map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className="flex items-center gap-1 p-1 rounded hover:bg-gray-100 text-xs"
                >
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={translateElementRef} style={{ display: 'none' }}></div>
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`google-translate-widget relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        disabled={!isLoaded}
      >
        <Languages className="h-4 w-4" />
        {getCurrentLanguageInfo().flag}
        <span className="hidden sm:inline">{getCurrentLanguageInfo().name}</span>
        <span className="sm:hidden">{currentLanguage.toUpperCase()}</span>
      </Button>

      {isOpen && isLoaded && (
        <div className="absolute top-full mt-2 right-0 bg-white border rounded-lg shadow-lg z-50 w-64 max-h-80 overflow-y-auto">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Google Translate</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Powered by Google • 100+ languages</p>
          </div>
          
          <div className="p-2">
            {GOOGLE_TRANSLATE_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-left transition-colors ${
                  currentLanguage === language.code ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {currentLanguage === language.code && (
                  <span className="ml-auto text-xs text-blue-600">Current</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Google Translate element */}
      <div ref={translateElementRef} style={{ display: 'none' }}></div>
    </div>
  );
}

// Hook to check if Google Translate is active
export function useGoogleTranslateStatus() {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    const checkStatus = () => {
      const isTranslated = document.documentElement.classList.contains('translated-ltr') ||
                          document.documentElement.classList.contains('translated-rtl') ||
                          document.querySelector('.goog-te-banner-frame') !== null;
      setIsActive(isTranslated);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return isActive;
}
