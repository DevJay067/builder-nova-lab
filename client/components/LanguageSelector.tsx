import React, { useState, useEffect } from 'react';
import GoogleTranslateWidget from '@/components/GoogleTranslateWidget';
import SimpleFallbackTranslate from '@/components/SimpleFallbackTranslate';

interface LanguageSelectorProps {
  variant?: "default" | "compact" | "icon-only";
  showFlag?: boolean;
  className?: string;
}

export default function LanguageSelector({
  variant = "default",
  showFlag = true,
  className = "",
}: LanguageSelectorProps) {
  const [useGoogleTranslate, setUseGoogleTranslate] = useState(true);
  const [googleTranslateLoaded, setGoogleTranslateLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Translate is working
    const checkGoogleTranslate = () => {
      setTimeout(() => {
        if (window.google?.translate) {
          setGoogleTranslateLoaded(true);
        } else {
          setUseGoogleTranslate(false);
        }
      }, 3000); // Give Google Translate 3 seconds to load
    };

    checkGoogleTranslate();
  }, []);

  // Map variants to GoogleTranslateWidget variants
  const getTranslateVariant = () => {
    switch (variant) {
      case "compact":
      case "icon-only":
        return "button";
      default:
        return "dropdown";
    }
  };

  // Show fallback if Google Translate fails to load
  if (!useGoogleTranslate || !googleTranslateLoaded) {
    return (
      <SimpleFallbackTranslate className={className} />
    );
  }

  return (
    <GoogleTranslateWidget 
      variant={getTranslateVariant()}
      className={className}
    />
  );
}
