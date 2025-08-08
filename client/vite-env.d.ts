/// <reference types="vite/client" />

// Google Translate API types for Chrome auto-translate integration
declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: {
          _invalidateAllElements(): void;
        };
      };
    };
  }
}
