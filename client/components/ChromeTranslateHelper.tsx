import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Info, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

interface ChromeTranslateHelperProps {
  className?: string;
}

export default function ChromeTranslateHelper({ className = '' }: ChromeTranslateHelperProps) {
  const { currentLanguage, t } = useTranslation();
  const [chromeTranslateAvailable, setChromeTranslateAvailable] = useState(false);
  const [showChromeInstructions, setShowChromeInstructions] = useState(false);

  useEffect(() => {
    // Check if we're in Chrome and auto-translate is available
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    setChromeTranslateAvailable(isChrome);
  }, []);

  const triggerChromeTranslate = () => {
    // Method 1: Right-click simulation (doesn't work programmatically for security)
    // Method 2: Show instructions to user
    setShowChromeInstructions(true);
    
    // Method 3: Try to trigger through URL change (limited effectiveness)
    try {
      // Add a URL parameter that might trigger Chrome's translate detection
      const url = new URL(window.location.href);
      url.searchParams.set('translate', 'true');
      window.history.replaceState({}, '', url.toString());
      
      // Trigger a custom event that Chrome might listen to
      const event = new CustomEvent('languagechange', {
        detail: { language: currentLanguage }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.warn('Could not trigger Chrome translate programmatically:', error);
    }
  };

  const getChromeTranslateInstructions = () => {
    const instructions = [
      'Right-click anywhere on the page',
      'Select "Translate to [Your Language]" from the context menu',
      'Or click the translate icon in Chrome\'s address bar'
    ];
    
    return instructions;
  };

  if (!chromeTranslateAvailable) {
    return null;
  }

  return (
    <div className={`chrome-translate-helper ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerChromeTranslate}
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          Use Chrome Translate
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {showChromeInstructions && (
        <Alert className="mt-2">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="mb-2 font-medium">
              To use Chrome's auto-translate:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {getChromeTranslateInstructions().map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
            <div className="mt-2 text-xs text-muted-foreground">
              Chrome's translate will work alongside our built-in translation system.
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Hook to detect Chrome translate status
export function useChromeTranslateStatus() {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    const checkChromeTranslate = () => {
      const hasTranslateElements = document.querySelector('.goog-te-banner-frame, .goog-te-menu-frame');
      const hasTranslateFont = document.querySelector('font[face="arial"]');
      const hasTranslateClass = document.documentElement.classList.contains('translated-rtl') || 
                               document.documentElement.classList.contains('translated-ltr');
      
      setIsActive(!!(hasTranslateElements || hasTranslateFont || hasTranslateClass));
    };

    // Check initially
    checkChromeTranslate();

    // Set up observer for Chrome translate changes
    const observer = new MutationObserver(() => {
      checkChromeTranslate();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Also listen for font changes which Chrome translate might cause
    const fontObserver = new MutationObserver(() => {
      checkChromeTranslate();
    });

    fontObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      fontObserver.disconnect();
    };
  }, []);

  return isActive;
}
