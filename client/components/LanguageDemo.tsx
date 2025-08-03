import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Globe,
  Languages,
  CheckCircle,
  Star,
  Heart,
  Shield,
  Zap,
  Users,
  Clock,
} from "lucide-react";
import { useTranslation, SUPPORTED_LANGUAGES } from "@/contexts/LanguageContext";
import LanguageSelector from "./LanguageSelector";

export default function LanguageDemo() {
  const { t, currentLanguage, getCurrentLanguageInfo } = useTranslation();
  const [showDemo, setShowDemo] = useState(false);
  
  const currentLang = getCurrentLanguageInfo();
  
  const demoFeatures = [
    {
      key: 'features.aiAssistant',
      icon: Brain,
      color: 'bg-purple-500'
    },
    {
      key: 'features.monitoring',
      icon: Heart,
      color: 'bg-red-500'
    },
    {
      key: 'features.secure',
      icon: Shield,
      color: 'bg-green-500'
    }
  ];

  return (
    <Card className="shadow-colored-lg border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Multi-Language Support Demo</CardTitle>
              <CardDescription>
                Experience HealthChain in {SUPPORTED_LANGUAGES.length} languages
              </CardDescription>
            </div>
          </div>
          <LanguageSelector variant="default" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Language Status */}
        <Alert className="border-blue-200 bg-blue-50">
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{currentLang.flag}</span>
              <span className="font-medium">
                {t('language.current')}: {currentLang.nativeName}
              </span>
              <Badge variant="secondary" className="text-xs">
                {currentLanguage.toUpperCase()}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Demo Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{t('home.features')}</h4>
            <p className="text-sm text-muted-foreground">
              See how features are translated in the current language
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDemo(!showDemo)}
          >
            {showDemo ? t('buttons.close') : t('buttons.view')} Demo
          </Button>
        </div>

        {/* Feature Demo */}
        {showDemo && (
          <div className="space-y-3 border-t pt-4">
            {demoFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`p-2 rounded-lg text-white ${feature.color}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">
                      {t(feature.key)}
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {t(`${feature.key}.description`)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {t(`${feature.key}.stats`)}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Language Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
            <Languages className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-lg font-bold text-blue-600">{SUPPORTED_LANGUAGES.length}</div>
            <div className="text-xs text-gray-600">Languages</div>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <Globe className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-lg font-bold text-green-600">100%</div>
            <div className="text-xs text-gray-600">Translated</div>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-lg font-bold text-purple-600">Global</div>
            <div className="text-xs text-gray-600">Accessibility</div>
          </div>
        </div>

        {/* Available Languages List */}
        <div className="pt-4 border-t">
          <h5 className="font-medium text-sm mb-3">Available Languages</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((language) => (
              <div 
                key={language.code}
                className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors ${
                  currentLanguage === language.code 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{language.flag}</span>
                <span className="font-medium">{language.nativeName}</span>
                {currentLanguage === language.code && (
                  <CheckCircle className="w-3 h-3 text-blue-600 ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Star className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800">Quick Language Switch</div>
              <div className="text-yellow-700 mt-1">
                Click the language selector above to instantly switch between languages. 
                All text, navigation, and features will update automatically to your selected language.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
