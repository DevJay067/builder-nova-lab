import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UseTranslateTextOptions {
  sourceLang?: string;
  cache?: boolean;
  immediate?: boolean;
}

export function useTranslateText(
  text: string, 
  options: UseTranslateTextOptions = {}
) {
  const { 
    sourceLang = "en", 
    cache = true, 
    immediate = true 
  } = options;
  
  const { currentLanguage, translateText, useGoogleTranslate } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (textToTranslate: string = text) => {
    if (!useGoogleTranslate || currentLanguage === sourceLang) {
      setTranslatedText(textToTranslate);
      return textToTranslate;
    }

    setIsTranslating(true);
    setError(null);
    
    try {
      const translated = await translateText(textToTranslate, currentLanguage);
      setTranslatedText(translated);
      return translated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Translation failed";
      setError(errorMessage);
      setTranslatedText(textToTranslate);
      return textToTranslate;
    } finally {
      setIsTranslating(false);
    }
  }, [text, currentLanguage, useGoogleTranslate, sourceLang, translateText]);

  useEffect(() => {
    if (immediate) {
      translate();
    }
  }, [translate, immediate]);

  return {
    translatedText,
    isTranslating,
    error,
    translate,
    retranslate: () => translate(text)
  };
}

export function useTranslateBatch(
  texts: string[], 
  options: UseTranslateTextOptions = {}
) {
  const { sourceLang = "en" } = options;
  const { currentLanguage, translateText, useGoogleTranslate } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateBatch = useCallback(async (textsToTranslate: string[] = texts) => {
    if (!useGoogleTranslate || currentLanguage === sourceLang) {
      setTranslatedTexts(textsToTranslate);
      return textsToTranslate;
    }

    setIsTranslating(true);
    setError(null);
    
    try {
      const promises = textsToTranslate.map(text => 
        translateText(text, currentLanguage)
      );
      const translated = await Promise.all(promises);
      setTranslatedTexts(translated);
      return translated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Batch translation failed";
      setError(errorMessage);
      setTranslatedTexts(textsToTranslate);
      return textsToTranslate;
    } finally {
      setIsTranslating(false);
    }
  }, [texts, currentLanguage, useGoogleTranslate, sourceLang, translateText]);

  useEffect(() => {
    translateBatch();
  }, [translateBatch]);

  return {
    translatedTexts,
    isTranslating,
    error,
    translateBatch,
    retranslate: () => translateBatch(texts)
  };
}

export default useTranslateText;
