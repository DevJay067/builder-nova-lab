import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Languages, Check } from 'lucide-react';

// Popular languages with Google Translate codes
const GOOGLE_TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-cn', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
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
    let isScriptLoaded = false;

    const loadGoogleTranslate = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="translate.google.com"]')) {
        if (window.google?.translate) {
          initializeTranslate();
        }
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isScriptLoaded = true;
      };

      script.onerror = () => {
        console.warn('Failed to load Google Translate script');
      };

      // Set up callback
      window.googleTranslateElementInit = () => {
        if (isScriptLoaded) {
          initializeTranslate();
        }
      };

      document.head.appendChild(script);
    };

    const initializeTranslate = () => {
      try {
        if (translateElementRef.current && window.google?.translate) {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: GOOGLE_TRANSLATE_LANGUAGES.map(lang => lang.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          }, translateElementRef.current);
          
          setIsLoaded(true);
          
          // Hide Google's default elements after they load
          setTimeout(() => {
            hideGoogleElements();
          }, 500);
        }
      } catch (error) {
        console.warn('Failed to initialize Google Translate:', error);
      }
    };

    const hideGoogleElements = () => {
      // Hide default Google Translate elements
      const elements = [
        '.goog-te-gadget',
        '.goog-te-banner-frame',
        '.goog-te-balloon-frame',
        '.goog-te-menu-frame'
      ];
      
      elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          (element as HTMLElement).style.display = 'none';
        }
      });

      // Ensure body is not pushed down
      document.body.style.top = '0px';
    };

    loadGoogleTranslate();

    return () => {
      // Cleanup on unmount
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  const changeLanguage = (langCode: string) => {
    try {
      if (!window.google?.translate) {
        console.warn('Google Translate not loaded yet');
        return;
      }

      // Method 1: Try to find and trigger the select element
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = langCode;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        setCurrentLanguage(langCode);
        setIsOpen(false);
        showLanguageNotification(langCode);
        return;
      }

      // Method 2: If select element not found, try alternative approach
      setTimeout(() => {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectElement) {
          selectElement.value = langCode;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          setCurrentLanguage(langCode);
          setIsOpen(false);
          showLanguageNotification(langCode);
        } else {
          // Method 3: Fallback - recreate the translate element
          console.log('Recreating translate element...');
          if (translateElementRef.current) {
            translateElementRef.current.innerHTML = '';
            new window.google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: GOOGLE_TRANSLATE_LANGUAGES.map(lang => lang.code).join(','),
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false
            }, translateElementRef.current);

            // Try again after recreation
            setTimeout(() => {
              const newSelectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
              if (newSelectElement) {
                newSelectElement.value = langCode;
                newSelectElement.dispatchEvent(new Event('change', { bubbles: true }));
                setCurrentLanguage(langCode);
                setIsOpen(false);
                showLanguageNotification(langCode);
              }
            }, 1000);
          }
        }
      }, 100);

    } catch (error) {
      console.warn('Error changing language:', error);
    }
  };

  const showLanguageNotification = (langCode: string) => {
    const language = GOOGLE_TRANSLATE_LANGUAGES.find(lang => lang.code === langCode);
    if (!language) return;

    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${language.flag}</span>
        <span>Translating to ${language.name}...</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const getCurrentLanguageInfo = () => {
    return GOOGLE_TRANSLATE_LANGUAGES.find(lang => lang.code === currentLanguage) || GOOGLE_TRANSLATE_LANGUAGES[0];
  };

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
            <p className="text-xs text-gray-600 mt-1">Powered by Google • Real-time translation</p>
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
                  <div className="ml-auto flex items-center gap-1">
                    <Check className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-600">Current</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="p-2 border-t bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Click any language to translate the entire page
            </p>
          </div>
        </div>
      )}

      {/* Hidden Google Translate element */}
      <div ref={translateElementRef} style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: '-9999px',
        visibility: 'hidden',
        width: '1px',
        height: '1px'
      }}></div>
      
      {!isLoaded && (
        <div className="absolute top-full mt-2 right-0 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg shadow-lg z-50 text-xs">
          Loading Google Translate...
        </div>
      )}
    </div>
  );
}
