import React, { createContext, useContext, useState, useEffect } from "react";

export type SupportedLanguage = "en" | "es" | "fr" | "hi" | "de" | "ja";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
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
  const [currentLanguage, setCurrentLanguage] =
    useState<SupportedLanguage>("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load translations for a specific language
  const loadTranslations = async (language: SupportedLanguage) => {
    setIsLoading(true);
    try {
      const translationModule = await import(
        `../translations/${language}.json`
      );
      setTranslations(translationModule.default);
    } catch (error) {
      console.warn(
        `Failed to load translations for ${language}, falling back to English`,
      );
      try {
        const englishModule = await import("../translations/en.json");
        setTranslations(englishModule.default);
      } catch (fallbackError) {
        console.error(
          "Failed to load even English translations:",
          fallbackError,
        );
        setTranslations({});
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "healthchain_language",
    ) as SupportedLanguage;
    if (
      savedLanguage &&
      SUPPORTED_LANGUAGES.some((lang) => lang.code === savedLanguage)
    ) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.slice(0, 2) as SupportedLanguage;
      if (SUPPORTED_LANGUAGES.some((lang) => lang.code === browserLang)) {
        setCurrentLanguage(browserLang);
      }
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    loadTranslations(currentLanguage);

    // Update document language and direction
    document.documentElement.lang = currentLanguage;
    const languageInfo = SUPPORTED_LANGUAGES.find(
      (lang) => lang.code === currentLanguage,
    );
    if (languageInfo?.rtl) {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, [currentLanguage]);

  const changeLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    localStorage.setItem("healthchain_language", language);

    // Announce language change for screen readers
    const announcement = `Language changed to ${SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name}`;
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.style.position = "absolute";
    announcer.style.left = "-10000px";
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key] || key;

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
