import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Languages, Check, Globe } from "lucide-react";
import {
  useLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/contexts/LanguageContext";

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
  const { currentLanguage, changeLanguage, getCurrentLanguageInfo, t } =
    useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = getCurrentLanguageInfo();

  const handleLanguageChange = (languageCode: SupportedLanguage) => {
    changeLanguage(languageCode);
    setIsOpen(false);

    // Optional: Show a brief notification
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50 fade-in";
    notification.textContent = `${t("language.current")}: ${SUPPORTED_LANGUAGES.find((l) => l.code === languageCode)?.nativeName}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.opacity = "0";
        setTimeout(() => document.body.removeChild(notification), 300);
      }
    }, 2000);
  };

  if (variant === "icon-only") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-9 w-9 p-0 ${className}`}
            aria-label={t("language.select")}
          >
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            {t("language.select")}
          </div>
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{language.flag}</span>
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-muted-foreground">
                    {language.name}
                  </div>
                </div>
              </div>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "compact") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 px-2 ${className}`}
          >
            {showFlag && <span className="mr-1">{currentLang.flag}</span>}
            <span className="text-xs">{currentLang.code.toUpperCase()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            {t("language.select")}
          </div>
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{language.flag}</span>
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-muted-foreground">
                    {language.name}
                  </div>
                </div>
              </div>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center space-x-2 ${className}`}
        >
          <Languages className="h-4 w-4" />
          {showFlag && <span>{currentLang.flag}</span>}
          <span className="hidden sm:inline">{currentLang.nativeName}</span>
          <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center space-x-2">
            <Languages className="h-4 w-4 text-primary" />
            <span className="font-medium">{t("language.select")}</span>
          </div>
          <div className="mt-1 flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {t("language.current")}: {currentLang.nativeName}
            </Badge>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{language.flag}</span>
                <div>
                  <div className="font-medium text-sm">
                    {language.nativeName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {currentLanguage === language.code && (
                  <>
                    <Badge variant="default" className="text-xs">
                      {t("language.current")}
                    </Badge>
                    <Check className="h-4 w-4 text-green-600" />
                  </>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        <div className="px-3 py-2 border-t bg-gray-50">
          <div className="text-xs text-muted-foreground text-center">
            🌍 {SUPPORTED_LANGUAGES.length} languages supported
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
