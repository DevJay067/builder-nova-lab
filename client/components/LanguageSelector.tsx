import React from 'react';
import GoogleTranslateWidget from '@/components/GoogleTranslateWidget';

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

  return (
    <GoogleTranslateWidget 
      variant={getTranslateVariant()}
      className={className}
    />
  );
}
