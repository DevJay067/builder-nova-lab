import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Languages, Check } from 'lucide-react';

// Languages supported by Google Translate
const GOOGLE_TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-cn', name: '中文', flag: '🇨🇳' },
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
    const loadGoogleTranslate = () => {
      // Check if already loaded
      if (window.google?.translate) {
        initializeTranslate();
        return;
      }

      // Create script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      
      // Initialize callback
      window.googleTranslateElementInit = () => {
        initializeTranslate();
      };

      document.head.appendChild(script);
    };

    const initializeTranslate = () => {
      if (translateElementRef.current && window.google?.translate) {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: GOOGLE_TRANSLATE_LANGUAGES.map(lang => lang.code).join(','),
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true
            },
            translateElementRef.current
          );
          
          setIsLoaded(true);
          
          // Hide Google's default elements
          setTimeout(() => {
            hideGoogleElements();
          }, 1000);
          
        } catch (error) {
          console.warn('Google Translate initialization failed:', error);
        }
      }
    };

    const hideGoogleElements = () => {
      const elements = [
        '.goog-te-gadget',
        '.goog-te-banner-frame',
        'iframe.goog-te-banner-frame',
        '.goog-te-menu-frame'
      ];
      
      elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          (element as HTMLElement).style.display = 'none';
        }
      });

      // Prevent body from being pushed down
      document.body.style.top = '0px';
      document.body.style.position = 'static';
    };

    loadGoogleTranslate();

    return () => {
      // Cleanup
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  const translateToLanguage = (langCode: string) => {
    if (!isLoaded || !window.google?.translate) {
      console.warn('Google Translate not ready');
      return;
    }

    try {
      // Find the Google Translate select element
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      
      if (selectElement) {
        // Change the select value and trigger change event
        selectElement.value = langCode;
        
        // Create and dispatch change event
        const changeEvent = new Event('change', { 
          bubbles: true, 
          cancelable: true 
        });
        selectElement.dispatchEvent(changeEvent);
        
        // Update our state
        setCurrentLanguage(langCode);
        setIsOpen(false);
        
        // Show notification
        showNotification(langCode);
        
      } else {
        // If select not found, try to reinitialize
        console.log('Google Translate select not found, reinitializing...');
        setTimeout(() => {
          const newSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (newSelect) {
            newSelect.value = langCode;
            newSelect.dispatchEvent(new Event('change', { bubbles: true }));
            setCurrentLanguage(langCode);
            setIsOpen(false);
            showNotification(langCode);
          }
        }, 500);
      }
      
    } catch (error) {
      console.warn('Translation error:', error);
    }
  };

  const showNotification = (langCode: string) => {
    const language = GOOGLE_TRANSLATE_LANGUAGES.find(lang => lang.code === langCode);
    if (!language) return;

    // Remove existing notification
    const existing = document.querySelector('.translate-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'translate-notification fixed top-4 right-4 bg-blue-100 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-[9999] transition-opacity';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${language.flag}</span>
        <span>${langCode === 'en' ? 'Showing original content' : `Translated to ${language.name}`}</span>
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

  return (
    <div className={`relative ${className}`}>
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

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border rounded-lg shadow-lg z-50 w-64 max-h-80 overflow-y-auto">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Translate Page</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Powered by Google Translate</p>
          </div>
          
          <div className="p-2">
            {GOOGLE_TRANSLATE_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => translateToLanguage(language.code)}
                className={`w-full flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-left transition-colors ${
                  currentLanguage === language.code ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {currentLanguage === language.code && (
                  <div className="ml-auto flex items-center gap-1">
                    <Check className="h-3 w-3 text-blue-600" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="p-2 border-t bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Translates the entire page content
            </p>
          </div>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute top-full mt-2 right-0 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg shadow-lg z-50 text-xs">
          Loading translator...
        </div>
      )}

      {/* Hidden Google Translate element */}
      <div 
        ref={translateElementRef} 
        style={{ 
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden',
          width: '1px',
          height: '1px'
        }}
      />
    </div>
  );
}
