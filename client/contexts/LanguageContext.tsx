import React, { createContext, useContext, useState, useEffect } from "react";

export type SupportedLanguage = "en" | "es" | "fr" | "hi" | "de" | "ja" | "zh" | "ar" | "pt" | "ru" | "ko" | "it" | "tr" | "nl" | "sv";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

// Extended language support with Google Translate
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
];

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
  getCurrentLanguageInfo: () => LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("en");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("healthchain_language") as SupportedLanguage;
    if (savedLanguage && SUPPORTED_LANGUAGES.some((lang) => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.slice(0, 2) as SupportedLanguage;
      if (SUPPORTED_LANGUAGES.some((lang) => lang.code === browserLang)) {
        setCurrentLanguage(browserLang);
      }
    }
  }, []);

  // Update document attributes when language changes
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    const languageInfo = SUPPORTED_LANGUAGES.find(
      (lang) => lang.code === currentLanguage,
    );
    if (languageInfo?.rtl) {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }

    // Update meta tag for Google Translate
    let contentLanguageMeta = document.querySelector('meta[http-equiv="content-language"]');
    if (!contentLanguageMeta) {
      contentLanguageMeta = document.createElement('meta');
      contentLanguageMeta.setAttribute('http-equiv', 'content-language');
      document.head.appendChild(contentLanguageMeta);
    }
    contentLanguageMeta.setAttribute('content', currentLanguage);
  }, [currentLanguage]);

  const changeLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    localStorage.setItem("healthchain_language", language);
  };

  // Simplified translation function - now relies on Google Translate
  const t = (key: string, params?: Record<string, string | number>): string => {
    // For basic keys, return English text that Google Translate will handle
    const basicTranslations: Record<string, string> = {
      'app.title': 'HealthChain',
      'nav.home': 'Home',
      'nav.dashboard': 'Dashboard', 
      'auth.login': 'Login',
      'language.select': 'Select Language',
      'language.current': 'Current',
      // Add more basic keys as needed
    };

    let translation = basicTranslations[key] || key;

    // Handle parameter substitution
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(
          new RegExp(`{{${param}}}`, "g"),
          String(value),
        );
      });
    }

    return translation;
  };

  const getCurrentLanguageInfo = (): LanguageOption => {
    return (
      SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLanguage) ||
      SUPPORTED_LANGUAGES[0]
    );
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        isLoading,
        getCurrentLanguageInfo,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  return useLanguage();
}
