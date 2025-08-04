# Google Translate Integration

The HealthChain platform now includes comprehensive Google Translate integration for dynamic, real-time translation of content across multiple languages.

## Features

### 🌍 Dynamic Translation

- Real-time translation using Google Translate API
- Fallback to Microsoft Translator API
- Browser-based translation support (no API key required)
- Automatic language detection

### 🎛️ Translation Controls

- Toggle Google Translate on/off via language selector
- Persistent user preference storage
- Visual indicators for translation status
- Manual translation trigger options

### 🔧 Developer Tools

- `Translation` component for wrapping text
- `useTranslateText` hook for programmatic translation
- `translateText` context method for dynamic translation
- Batch translation support for multiple texts

## Usage

### Quick Start

1. **Enable Google Translate**: Click the language selector and toggle "Google Translate" to "On"

2. **Change Language**: Select any language from the dropdown to see dynamic translation

3. **Test Translation**: Visit `/translation-test` to see comprehensive translation examples

### Component Usage

```tsx
import { Translation } from "@/components/Translation";

// Simple text translation
<Translation text="Hello World" />

// With custom source language
<Translation text="Bonjour" sourceLang="fr" />
```

### Hook Usage

```tsx
import { useTranslateText } from "@/hooks/useTranslateText";

function MyComponent() {
  const { translatedText, isTranslating, translate } =
    useTranslateText("Hello World");

  return (
    <div>
      <p>{translatedText}</p>
      {isTranslating && <span>Translating...</span>}
      <button onClick={() => translate("New text")}>Translate</button>
    </div>
  );
}
```

### Context Usage

```tsx
import { useLanguage } from "@/contexts/LanguageContext";

function MyComponent() {
  const { translateText, useGoogleTranslate, toggleGoogleTranslate } =
    useLanguage();

  const handleTranslate = async () => {
    const result = await translateText("Hello World", "es");
    console.log(result); // "Hola Mundo"
  };
}
```

## Configuration

### Environment Variables

Create a `.env` file with your API keys:

```env
# Google Translate API (Primary)
VITE_GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# Microsoft Translator API (Fallback)
VITE_MICROSOFT_TRANSLATOR_KEY=your_microsoft_translator_key
```

### Getting API Keys

#### Google Translate API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google Translate API
4. Create credentials (API key)
5. Add the key to your environment variables

#### Microsoft Translator API (Optional)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a Translator resource
3. Get the subscription key
4. Add to environment variables

## Supported Languages

The system supports all major languages including:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)
- Hindi (hi)
- Arabic (ar)

## Fallback Behavior

The translation system has multiple fallback levels:

1. **Google Translate API** (if API key provided)
2. **Microsoft Translator API** (if API key provided)
3. **Browser-based Google Translate** (limited functionality)
4. **Static translation files** (basic support)
5. **Original text** (no translation)

## Components

### Translation Component

- `<Translation text="..." />` - Simple text translation
- Automatic language detection
- Loading states and error handling
- Caching for performance

### LanguageSelector Enhancement

- Google Translate toggle switch
- Visual status indicators
- Settings persistence
- Improved UX with notifications

### TranslationDemo Page

- Comprehensive testing interface
- Sample translations
- Interactive translation testing
- Feature showcase

## Performance Optimization

### Caching

- Translation results are cached in memory
- Reduces API calls for repeated translations
- Cache can be cleared when needed

### Batch Translation

- Multiple texts can be translated in a single request
- Improved performance for large content blocks
- Automatic batching for lists and arrays

### Loading States

- Visual indicators during translation
- Graceful degradation on API failures
- Non-blocking UI updates

## Accessibility

- Screen reader announcements for language changes
- Keyboard navigation support
- High contrast mode compatibility
- ARIA labels for translation controls

## Browser Compatibility

- Modern browsers with fetch API support
- Graceful degradation for older browsers
- Progressive enhancement approach
- Mobile device optimization

## Security

- API keys handled securely via environment variables
- No sensitive data logged in console
- CORS-compliant API requests
- Input sanitization for translation content

## Testing

Visit `/translation-test` to:

- Test real-time translation
- See sample translations
- Toggle Google Translate on/off
- Experience the full feature set

## Troubleshooting

### Common Issues

**Translation not working:**

- Check if Google Translate is enabled in language selector
- Verify API key configuration
- Check browser console for errors

**API limits reached:**

- Google Translate API has usage limits
- Consider upgrading your Google Cloud plan
- Fallback systems will activate automatically

**Slow translation:**

- Network connection may be slow
- API response times vary by region
- Caching reduces subsequent translation times

### Debug Mode

Enable debug logging by adding to console:

```javascript
localStorage.setItem("translation_debug", "true");
```

This will log translation requests and responses for debugging.
