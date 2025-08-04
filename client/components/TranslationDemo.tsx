import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Languages, Zap } from "lucide-react";
import { useTranslateText } from "@/hooks/useTranslateText";
import { Translation } from "./Translation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TranslationDemo() {
  const [inputText, setInputText] = useState("Hello, this is a test message for translation!");
  const { currentLanguage, useGoogleTranslate, toggleGoogleTranslate } = useLanguage();
  const { translatedText, isTranslating, translate } = useTranslateText(inputText, { immediate: false });

  const sampleTexts = [
    "Welcome to our healthcare platform",
    "Your health data is secure and private",
    "Real-time monitoring helps track your vitals",
    "AI-powered insights for better health decisions",
    "Emergency first aid procedures available 24/7"
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Languages className="h-6 w-6 text-blue-600" />
              <CardTitle>Translation Demo</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={useGoogleTranslate ? "default" : "secondary"}>
                Google Translate: {useGoogleTranslate ? "ON" : "OFF"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleGoogleTranslate}
              >
                <Zap className="h-4 w-4 mr-1" />
                Toggle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Test Text Translation (Current Language: {currentLanguage.toUpperCase()})
            </label>
            <div className="flex space-x-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to translate..."
                className="flex-1"
              />
              <Button 
                onClick={() => translate(inputText)}
                disabled={isTranslating}
              >
                {isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Translate"
                )}
              </Button>
            </div>
          </div>

          {translatedText && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Translated Result:</div>
              <div className="font-medium">{translatedText}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample Translations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {sampleTexts.map((text, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Original (EN):</div>
                <div className="mb-3">{text}</div>
                <div className="text-sm text-gray-600 mb-2">
                  Translated ({currentLanguage.toUpperCase()}):
                </div>
                <div className="font-medium text-blue-700">
                  <Translation text={text} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translation Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">
                <Translation text="Real-time Translation" />
              </h3>
              <p className="text-sm text-gray-600">
                <Translation text="Instant translation as you type" />
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Languages className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">
                <Translation text="Multiple Languages" />
              </h3>
              <p className="text-sm text-gray-600">
                <Translation text="Support for 6+ languages" />
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="h-8 w-8 bg-orange-600 rounded mx-auto mb-2 flex items-center justify-center text-white font-bold">
                AI
              </div>
              <h3 className="font-semibold mb-1">
                <Translation text="AI-Powered" />
              </h3>
              <p className="text-sm text-gray-600">
                <Translation text="Google Translate integration" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
