import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GoogleTranslateLoaderProps {
  children: React.ReactNode;
}

export function GoogleTranslateLoader({ children }: GoogleTranslateLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { useGoogleTranslate } = useLanguage();

  useEffect(() => {
    if (!useGoogleTranslate) {
      setIsLoaded(true);
      return;
    }

    // Check if Google Translate is already loaded
    if ((window as any).google?.translate) {
      setIsLoaded(true);
      return;
    }

    // Add Google Translate script
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;

    // Create the initialization function
    (window as any).googleTranslateElementInit = () => {
      if ((window as any).google?.translate?.TranslateElement) {
        // Initialize the widget (hidden)
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'en',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          includedLanguages: 'en,es,fr,de,it,pt,ru,ja,ko,zh,hi,ar'
        }, 'google_translate_element');
        
        setIsLoaded(true);
      }
    };

    script.onload = () => {
      // Script loaded, but we need to wait for the callback
      if ((window as any).google?.translate) {
        setIsLoaded(true);
      }
    };

    script.onerror = () => {
      console.warn('Failed to load Google Translate script');
      setIsLoaded(true); // Continue without Google Translate
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete (window as any).googleTranslateElementInit;
    };
  }, [useGoogleTranslate]);

  return (
    <>
      {children}
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>
    </>
  );
}

export default GoogleTranslateLoader;
