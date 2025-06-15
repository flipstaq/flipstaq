'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getInitialLanguage, setDocumentDirection } from '@/lib/utils';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
  t: (key: string, namespace?: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [mounted, setMounted] = useState(false);

  const isRTL = language === 'ar';

  useEffect(() => {
    const initialLanguage = getInitialLanguage();
    setLanguageState(initialLanguage);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadTranslations(language);
      setDocumentDirection(language);
      localStorage.setItem('language', language);
    }
  }, [language, mounted]);
  const loadTranslations = async (lang: Language) => {
    try {
      // Load common and auth translations
      const commonResponse = await fetch(`/locales/${lang}/common.json`);
      const authResponse = await fetch(`/locales/${lang}/auth.json`);

      // Load admin translations
      const adminCommonResponse = await fetch(
        `/locales/${lang}/admin/common.json`
      );
      const adminUsersResponse = await fetch(
        `/locales/${lang}/admin/users.json`
      );

      if (commonResponse.ok && authResponse.ok) {
        const common = await commonResponse.json();
        const auth = await authResponse.json();

        const translationData: Translations = {
          common,
          auth,
        };

        // Add admin translations if available
        if (adminCommonResponse.ok) {
          const adminCommon = await adminCommonResponse.json();
          translationData['admin-common'] = adminCommon;
        }

        if (adminUsersResponse.ok) {
          const adminUsers = await adminUsersResponse.json();
          translationData['admin-users'] = adminUsers;
        }

        setTranslations(translationData);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English if loading fails
      if (lang !== 'en') {
        loadTranslations('en');
      }
    }
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const t = (key: string, namespace: string = 'common'): string => {
    const keys = key.split('.');
    let value = translations[namespace];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  };
  // Prevent hydration mismatch by providing a default context during SSR
  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{
          language: 'en',
          setLanguage: () => {},
          translations: {},
          t: (key: string) => key,
          isRTL: false,
        }}
      >
        <div>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, translations, t, isRTL }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
