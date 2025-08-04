import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TranslationProps {
  text: string;
  sourceLang?: string;
  className?: string;
  fallback?: string;
  cache?: boolean;
}

export function Translation({
  text,
  sourceLang = "en",
  className = "",
  fallback = "",
  cache = true,
}: TranslationProps) {
  const { currentLanguage, translateText, useGoogleTranslate } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const performTranslation = async () => {
      if (!useGoogleTranslate || currentLanguage === sourceLang) {
        setTranslatedText(text);
        return;
      }

      setIsTranslating(true);
      try {
        const translated = await translateText(text, currentLanguage);
        setTranslatedText(translated);
      } catch (error) {
        console.warn("Translation failed:", error);
        setTranslatedText(fallback || text);
      } finally {
        setIsTranslating(false);
      }
    };

    performTranslation();
  }, [
    text,
    currentLanguage,
    useGoogleTranslate,
    sourceLang,
    translateText,
    fallback,
  ]);

  return (
    <span className={`${className} ${isTranslating ? "opacity-75" : ""}`}>
      {translatedText}
    </span>
  );
}

interface TranslateProps {
  children: string;
  sourceLang?: string;
  className?: string;
}

export function Translate({
  children,
  sourceLang = "en",
  className = "",
}: TranslateProps) {
  return (
    <Translation
      text={children}
      sourceLang={sourceLang}
      className={className}
    />
  );
}

export default Translation;
