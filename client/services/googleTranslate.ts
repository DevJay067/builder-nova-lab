interface GoogleTranslateResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

interface GoogleTranslateError {
  error: {
    message: string;
    code: number;
  };
}

class GoogleTranslateService {
  private apiKey: string | null = null;
  private cache: Map<string, string> = new Map();
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2';

  constructor() {
    // API key can be set via environment or configuration
    this.apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getCacheKey(text: string, targetLang: string, sourceLang?: string): string {
    return `${sourceLang || 'auto'}->${targetLang}:${text}`;
  }

  async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<string> {
    if (!text.trim()) return text;

    const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // If no API key, fall back to browser-based translation
    if (!this.apiKey) {
      return this.fallbackTranslation(text, targetLanguage, sourceLanguage);
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: text,
        target: targetLanguage,
        format: 'text'
      });

      if (sourceLanguage && sourceLanguage !== 'auto') {
        params.append('source', sourceLanguage);
      }

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const translatedText = data.data.translations[0].translatedText;
      
      // Cache the result
      this.cache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (error) {
      console.warn('Google Translate API failed, using fallback:', error);
      return this.fallbackTranslation(text, targetLanguage, sourceLanguage);
    }
  }

  private async fallbackTranslation(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<string> {
    // Browser-based translation using Web API (limited but works without API key)
    try {
      // Check if browser supports translation
      if ('google' in window && (window as any).google?.translate) {
        return this.useBrowserGoogleTranslate(text, targetLanguage, sourceLanguage);
      }
      
      // Try using Microsoft Translator as fallback
      return this.useMicrosoftTranslator(text, targetLanguage, sourceLanguage);
    } catch (error) {
      console.warn('All translation methods failed:', error);
      return text; // Return original text as last resort
    }
  }

  private async useBrowserGoogleTranslate(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<string> {
    return new Promise((resolve) => {
      try {
        const googleTranslate = (window as any).google.translate;
        googleTranslate.TranslateElement.translateText(
          text,
          sourceLanguage || 'auto',
          targetLanguage,
          (translatedText: string) => {
            resolve(translatedText || text);
          }
        );
      } catch (error) {
        resolve(text);
      }
    });
  }

  private async useMicrosoftTranslator(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<string> {
    try {
      // Microsoft Translator Text API (free tier available)
      const response = await fetch('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=' + targetLanguage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': import.meta.env.VITE_MICROSOFT_TRANSLATOR_KEY || ''
        },
        body: JSON.stringify([{ text }])
      });

      if (response.ok) {
        const data = await response.json();
        return data[0]?.translations[0]?.text || text;
      }
    } catch (error) {
      console.warn('Microsoft Translator failed:', error);
    }
    
    return text;
  }

  async translateBatch(
    texts: string[], 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<string[]> {
    const promises = texts.map(text => 
      this.translateText(text, targetLanguage, sourceLanguage)
    );
    
    return Promise.all(promises);
  }

  clearCache() {
    this.cache.clear();
  }

  getSupportedLanguages(): string[] {
    return [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 
      'hi', 'ar', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
    ];
  }

  async detectLanguage(text: string): Promise<string> {
    if (!this.apiKey) return 'en';

    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text })
      });

      const data = await response.json();
      return data.data.detections[0][0].language || 'en';
    } catch (error) {
      console.warn('Language detection failed:', error);
      return 'en';
    }
  }
}

export const googleTranslateService = new GoogleTranslateService();
export default googleTranslateService;
