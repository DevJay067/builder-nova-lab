import React, { useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';

interface TranslationWrapperProps {
  children: React.ReactNode;
}

// Common text mappings for automatic translation
const COMMON_TRANSLATIONS: Record<string, string> = {
  // Navigation and UI
  'Back to Dashboard': 'nav.back',
  'Dashboard': 'nav.dashboard',
  'Login': 'auth.login',
  'Logout': 'auth.logout',
  'Home': 'nav.home',
  
  // Buttons
  'Save': 'buttons.save',
  'Cancel': 'buttons.cancel',
  'Delete': 'buttons.delete',
  'Edit': 'buttons.edit',
  'View': 'buttons.view',
  'Download': 'buttons.download',
  'Upload': 'buttons.upload',
  'Refresh': 'buttons.refresh',
  'Search': 'buttons.search',
  'Filter': 'buttons.filter',
  'Export': 'buttons.export',
  'Import': 'buttons.import',
  'Close': 'buttons.close',
  'Submit': 'buttons.submit',
  'Continue': 'buttons.continue',
  
  // Status
  'Online': 'status.online',
  'Offline': 'status.offline',
  'Connected': 'status.connected',
  'Connecting': 'status.connecting',
  'Loading': 'status.loading',
  'Success': 'status.success',
  'Error': 'status.error',
  
  // Health specific
  'Health Records': 'history.title',
  'Health Analytics': 'analytics.title',
  'B-max AI Assistant': 'bmax.title',
  'Real-time Monitoring': 'monitoring.title',
  'Authentication Required': 'auth.authenticationRequired',
  'Secure': 'bmax.secure',
  'Private': 'bmax.private',
  'Personalized': 'bmax.personalized',
  
  // Time
  'Now': 'time.now',
  'Today': 'time.today',
  'Yesterday': 'time.yesterday',
  'This Week': 'time.thisWeek',
  'This Month': 'time.thisMonth',
  
  // Health
  'Heart Rate': 'monitoring.heartRate',
  'Blood Pressure': 'monitoring.bloodPressure',
  'Temperature': 'monitoring.temperature',
  'Oxygen Saturation': 'monitoring.oxygenSaturation',
  'Normal': 'monitoring.normal',
  'High': 'monitoring.high',
  'Low': 'monitoring.low',
  
  // Common form fields
  'Username': 'auth.username',
  'Password': 'auth.password',
  'Email': 'auth.email',
  'First Name': 'auth.firstName',
  'Last Name': 'auth.lastName',
  'Title': 'history.title.field',
  'Description': 'history.description',
  'Date': 'history.date',
  'Doctor': 'history.doctor',
  'Notes': 'history.notes',
  
  // Notifications
  'Notifications': 'analytics.notifications',
  'Enabled': 'analytics.enabled',
  'Enable Notifications': 'tracking.enableNotifications',
  'Test Notifications': 'tracking.testNotifications',
  
  // Data and storage
  'Data saved successfully': 'success.dataSaved',
  'Export': 'storage.export',
  'Import': 'storage.import',
  'Protected': 'storage.protected',

  // Health History specific
  'Total Records': 'history.totalRecords',
  'Secure Records': 'history.secureRecords',
  'Last Update': 'history.lastUpdate',
  'Search & Filter Records': 'history.searchRecords',
  'All Types': 'history.allTypes',
  'Sort by Date': 'history.sortByDate',
  'No Records Found': 'history.noRecords',
  'Start by adding your first health record': 'history.startAdding',
  'Add Your First Record': 'history.addFirstRecord',
  'Add New Record': 'history.addNewRecord',
  'Medical Records': 'history.medicalRecords',
  'Lab Results': 'history.labResults',
  'Prescriptions': 'history.prescriptions',
  'Appointments': 'history.appointments',
  'Vaccination Records': 'history.vaccinations',
  'All Records': 'history.allRecords',
  'Recent Records': 'history.recentRecords',
  'Oldest First': 'history.oldestFirst',
  'Newest First': 'history.newestFirst',
  'Type': 'history.type',
  'Record Type': 'history.recordType',
  'Record Title': 'history.recordTitle',
  'Add Record': 'history.addRecord',
  'View Details': 'history.viewDetails',
  'Quick Add': 'history.quickAdd',
  'Quick Add Health Record': 'history.quickAddRecord',
  'Enter record details': 'history.enterDetails',
  'Record added successfully': 'history.recordAdded',
  'Secure Medical Records': 'history.secureRecords',
  'Health Data Management': 'history.dataManagement',
  'Private & Encrypted': 'history.privateEncrypted',
  'Search records...': 'history.searchPlaceholder',
  'Filter by type...': 'history.filterPlaceholder',
  'Select record type': 'history.selectType',
  'Record details': 'history.recordDetails',
  'Add medical record': 'history.addMedicalRecord',
  'Created': 'history.created',
  'Updated': 'history.updated',
  'Record ID': 'history.recordId',
  'Medical Report': 'history.medicalReport',
  'Lab Report': 'history.labReport',
  'Prescription': 'history.prescription',
  'Vaccination': 'history.vaccination',
  'Appointment': 'history.appointment',
  'Other': 'history.other',
  'High Priority': 'history.highPriority',
  'Medium Priority': 'history.mediumPriority',
  'Low Priority': 'history.lowPriority',
  'Confidential': 'history.confidential',
  'Normal': 'history.normal',
  'Urgent': 'history.urgent',
  'Routine': 'history.routine'
};

export default function TranslationWrapper({ children }: TranslationWrapperProps) {
  const { t, currentLanguage } = useTranslation();

  // Function to translate text nodes
  const translateTextNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        const translationKey = COMMON_TRANSLATIONS[text];
        if (translationKey) {
          const translatedText = t(translationKey);
          if (translatedText !== translationKey) {
            node.textContent = translatedText;
          }
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      
      // Skip certain elements
      if (element.tagName === 'SCRIPT' || 
          element.tagName === 'STYLE' || 
          element.hasAttribute('data-no-translate') ||
          element.classList.contains('no-translate')) {
        return;
      }
      
      // Translate placeholder attributes
      if (element.hasAttribute('placeholder')) {
        const placeholder = element.getAttribute('placeholder');
        if (placeholder) {
          const translationKey = COMMON_TRANSLATIONS[placeholder];
          if (translationKey) {
            const translatedText = t(translationKey);
            if (translatedText !== translationKey) {
              element.setAttribute('placeholder', translatedText);
            }
          }
        }
      }
      
      // Translate title attributes
      if (element.hasAttribute('title')) {
        const title = element.getAttribute('title');
        if (title) {
          const translationKey = COMMON_TRANSLATIONS[title];
          if (translationKey) {
            const translatedText = t(translationKey);
            if (translatedText !== translationKey) {
              element.setAttribute('title', translatedText);
            }
          }
        }
      }
      
      // Translate aria-label attributes
      if (element.hasAttribute('aria-label')) {
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
          const translationKey = COMMON_TRANSLATIONS[ariaLabel];
          if (translationKey) {
            const translatedText = t(translationKey);
            if (translatedText !== translationKey) {
              element.setAttribute('aria-label', translatedText);
            }
          }
        }
      }
      
      // Recursively process child nodes
      for (let i = 0; i < node.childNodes.length; i++) {
        translateTextNodes(node.childNodes[i]);
      }
    }
  };

  // Run translation on language change
  useEffect(() => {
    const translatePage = () => {
      // Wait for DOM to be ready
      setTimeout(() => {
        try {
          translateTextNodes(document.body);
        } catch (error) {
          console.warn('Translation failed:', error);
        }
      }, 50);
    };

    translatePage();

    // Set up a MutationObserver to translate dynamically added content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            translateTextNodes(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
    });

    return () => {
      observer.disconnect();
    };
  }, [currentLanguage, t]);

  return <>{children}</>;
}

// Hook to get translated common text
export function useCommonTranslations() {
  const { t } = useTranslation();
  
  return {
    // Navigation
    backToDashboard: t('nav.back'),
    dashboard: t('nav.dashboard'),
    login: t('auth.login'),
    logout: t('auth.logout'),
    
    // Buttons
    save: t('buttons.save'),
    cancel: t('buttons.cancel'),
    delete: t('buttons.delete'),
    edit: t('buttons.edit'),
    view: t('buttons.view'),
    
    // Status
    online: t('status.online'),
    offline: t('status.offline'),
    loading: t('status.loading'),
    success: t('status.success'),
    error: t('status.error'),
    
    // Health
    healthRecords: t('history.title'),
    healthAnalytics: t('analytics.title'),
    bmaxAI: t('bmax.title'),
    
    // Common
    authRequired: t('auth.authenticationRequired'),
    secure: t('bmax.secure'),
    private: t('bmax.private'),
    personalized: t('bmax.personalized')
  };
}
